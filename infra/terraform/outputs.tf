output "cloud_run_url" {
  description = "HTTPS endpoint exposed by the DEWA Cloud Run v2 backend service."
  value       = google_cloud_run_v2_service.backend.uri
}

output "service_account_email" {
  description = "Least-privilege runtime IAM identity bound to Secret Manager."
  value       = google_service_account.backend_runner.email
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URI for container pushes."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.dewa.repository_id}"
}
