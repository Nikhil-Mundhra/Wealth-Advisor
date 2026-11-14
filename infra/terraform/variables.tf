variable "project_id" {
  description = "GCP project id hosting the Cloud Run service and Artifact Registry."
  type        = string
}

variable "region" {
  description = "GCP region eligible for Cloud Run Always Free tier."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "dewa-backend"
}

variable "image_tag" {
  description = "Container image tag deployed to Cloud Run."
  type        = string
  default     = "latest"
}
