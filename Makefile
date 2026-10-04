# Dev process control. Processes run in the background; logs live in .run/.
# Start/stop only ever act on processes whose working directory is inside this repo,
# so a different app on the same port is reported, never killed.

# Fixed ports; see docs/infra/ports.md. Vite and nginx hard-code the backend port, so change all three together.
BACKEND_PORT  := 3000
FRONTEND_PORT := 5173
PROXY_PORT    := 8088
VERCEL_PORT   := 8089
RUN_DIR       := .run
COMPOSE       := PROXY_PORT=$(PROXY_PORT) docker compose --progress quiet -f infra/docker-compose.yml
DOCKER_UP     := docker info >/dev/null 2>&1

.PHONY: help install frontend backend dev proxy stop-frontend stop-backend stop-proxy stop restart status logs build prod vercel-dev test db-indexes jwt-keys seed-demo docs-lint

help:  ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

install:  ## Install all workspace dependencies
	npm install

frontend: | $(RUN_DIR)  ## Start the Vite dev server (background)
	@$(call start_svc,frontend,$(FRONTEND_PORT),npm run dev -w frontend)

backend: | $(RUN_DIR)  ## Start the API dev server with watch (background)
	@$(call start_svc,backend,$(BACKEND_PORT),env PORT=$(BACKEND_PORT) npm run dev -w backend)

dev: backend frontend  ## Start both

stop-frontend:  ## Stop the frontend
	@$(call stop_svc,frontend,$(FRONTEND_PORT))

stop-backend:  ## Stop the backend
	@$(call stop_svc,backend,$(BACKEND_PORT))

proxy: build  ## Build the SPA and start nginx in front of the backend (needs Docker)
	@$(DOCKER_UP) || { echo "proxy NOT started: Docker is not running"; exit 1; }
	@if lsof -ti tcp:$(PROXY_PORT) -sTCP:LISTEN >/dev/null && [ -z "$$($(COMPOSE) ps -q nginx 2>/dev/null)" ]; then \
		echo "proxy NOT started: port $(PROXY_PORT) is held by another app (see docs/infra/ports.md)"; exit 1; fi
	@$(COMPOSE) up -d --quiet-pull
	@echo "proxy → http://localhost:$(PROXY_PORT)  (start the API with: make backend)"

stop-proxy:  ## Stop nginx
	@if $(DOCKER_UP) && [ -n "$$($(COMPOSE) ps -q nginx 2>/dev/null)" ]; then $(COMPOSE) down && echo "proxy stopped"; else echo "proxy not running"; fi

vercel-dev:  ## Run the Vercel routing (vercel.json services) locally, foreground
	vercel dev -L --listen $(VERCEL_PORT) --yes

stop: stop-frontend stop-backend stop-proxy  ## Stop everything

restart: stop dev  ## Stop everything, then start frontend + backend

status:  ## Show what is running
	@$(call status_svc,backend,$(BACKEND_PORT)); $(call status_svc,frontend,$(FRONTEND_PORT))
	@if $(DOCKER_UP) && [ -n "$$($(COMPOSE) ps -q nginx 2>/dev/null)" ]; then echo "  proxy  up     :$(PROXY_PORT)"; else echo "  proxy  down   :$(PROXY_PORT)"; fi

logs:  ## Tail frontend + backend logs
	@tail -n 30 -f $(RUN_DIR)/backend.log $(RUN_DIR)/frontend.log

build:  ## Build the frontend into frontend/dist
	npm run build

test:  ## Run backend unit + integration tests (starts a throwaway mongod)
	npm test

db-indexes:  ## Apply collection validators and indexes to MONGODB_URI (deploy step)
	npm run db:indexes -w backend

jwt-keys:  ## Print a new Ed25519 key pair as env lines
	npm run keys:generate -w backend

seed-demo:  ## Create the local demo account testing@example.com / testing (refuses NODE_ENV=production)
	npm run db:seed-demo -w backend

prod: build  ## Build, then serve frontend + API from one Node process (foreground)
	PORT=$(BACKEND_PORT) npm start

docs-lint:  ## Check agent guides and docs: links, file maps, reachability
	node scripts/docs-lint.mjs

$(RUN_DIR):
	@mkdir -p $(RUN_DIR)

# Shell snippet: sets $$all (every listener on port $(1)) and $$ours (those with cwd inside this repo).
define find_pids
all=$$(lsof -ti tcp:$(1) -sTCP:LISTEN); ours=""; \
for p in $$all; do \
	cwd=$$(lsof -a -p $$p -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
	case "$$cwd/" in "$(CURDIR)/"*) ours="$$ours $$p";; esac; done
endef

# $(1)=name $(2)=port $(3)=command
define start_svc
$(call find_pids,$(2)); \
if [ -n "$$ours" ]; then echo "$(1) already running on :$(2)"; \
elif [ -n "$$all" ]; then echo "$(1) NOT started: port $(2) is held by another app:"; \
	for p in $$all; do echo "    pid $$p: $$(ps -o command= -p $$p | cut -c1-80)"; done; exit 1; \
else nohup $(3) > $(RUN_DIR)/$(1).log 2>&1 & \
	echo "$(1) starting → http://localhost:$(2)  (log: $(RUN_DIR)/$(1).log)"; fi
endef

# $(1)=name $(2)=port. SIGTERM, then SIGKILL if still listening after ~3s. Never touches foreign processes.
define stop_svc
$(call find_pids,$(2)); \
if [ -n "$$all" ] && [ -z "$$ours" ]; then echo "$(1) not running (port $(2) is held by another app — left alone)"; \
elif [ -z "$$ours" ]; then echo "$(1) not running"; \
else kill $$ours; for i in 1 2 3 4 5 6; do kill -0 $$ours 2>/dev/null || break; sleep 0.5; done; \
	kill -9 $$ours 2>/dev/null; echo "$(1) stopped"; fi
endef

define status_svc
$(call find_pids,$(2)); \
if [ -n "$$ours" ]; then echo "  $(1)  up     :$(2)"; \
elif [ -n "$$all" ]; then echo "  $(1)  down   :$(2) (held by another app)"; \
else echo "  $(1)  down   :$(2)"; fi
endef
