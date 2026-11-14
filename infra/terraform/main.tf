provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_artifact_registry_repository" "dewa" {
  location      = var.region
  repository_id = "dewa-images"
  description   = "Container registry for DEWA backend images"
  format        = "DOCKER"
}

resource "google_service_account" "backend_runner" {
  account_id   = "${var.service_name}-sa"
  display_name = "DEWA Cloud Run Least-Privilege Service Account"
}

resource "google_secret_manager_secret" "mongodb_uri" {
  secret_id = "dewa-mongodb-uri"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_private_key" {
  secret_id = "dewa-jwt-private-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_public_key" {
  secret_id = "dewa-jwt-public-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "backend_secrets" {
  for_each = toset([
    google_secret_manager_secret.mongodb_uri.secret_id,
    google_secret_manager_secret.jwt_private_key.secret_id,
    google_secret_manager_secret.jwt_public_key.secret_id,
  ])
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_runner.email}"
}

resource "google_cloud_run_v2_service" "backend" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_runner.email

    # Scale to zero stays inside GCP Cloud Run Always Free monthly allowances.
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.dewa.repository_id}/${var.service_name}:${var.image_tag}"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongodb_uri.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_PRIVATE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_private_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_PUBLIC_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_public_key.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/api/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
        }
        period_seconds = 30
      }
    }
  }
}
