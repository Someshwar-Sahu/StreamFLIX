import boto3
from pathlib import Path
from app.core.config import settings

class BackblazeB2Provider:
    def __init__(self, name: str, endpoint: str, access_key: str, secret_key: str, bucket_name: str, max_gb: float):
        self.name = name
        self.bucket_name = bucket_name
        self.max_bytes = int(max_gb * 1024 * 1024 * 1024)
        self.endpoint = endpoint if (endpoint and endpoint.startswith("http")) else "https://s3.us-east-005.backblazeb2.com"

        self.client = None
        if access_key and secret_key:
            try:
                self.client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint,
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key
                )
            except Exception as e:
                print(f"Failed to initialize S3 client for {self.name}: {e}")

    def get_used_bytes(self) -> int:
        if not self.client:
            return 0
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            total_size = 0
            for page in paginator.paginate(Bucket=self.bucket_name):
                if "Contents" in page:
                    for obj in page["Contents"]:
                        total_size += obj["Size"]
            return total_size
        except Exception as e:
            print(f"Error checking size for {self.name}: {e}")
            return 0

    def can_fit(self, incoming_bytes: int) -> bool:
        used = self.get_used_bytes()
        return (used + incoming_bytes) <= self.max_bytes

    def upload_file(self, local_path: Path, s3_key: str, content_type: str = "video/mp4") -> str:
        if not self.client:
            raise RuntimeError(f"Storage provider {self.name} is not initialized with valid S3 credentials.")
        self.client.upload_file(
            str(local_path),
            self.bucket_name,
            s3_key,
            ExtraArgs={"ContentType": content_type}
        )
        return f"/{self.bucket_name}/{s3_key}"

class StorageManager:
    def __init__(self):
        self.buckets = [
            BackblazeB2Provider(
                name="B2 Acc 1",
                endpoint=getattr(settings, "B2_ACC1_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
                access_key=getattr(settings, "B2_ACC1_ACCESS_KEY", ""),
                secret_key=getattr(settings, "B2_ACC1_SECRET_KEY", ""),
                bucket_name=getattr(settings, "B2_ACC1_BUCKET", "streamflix-b2-1"),
                max_gb=float(getattr(settings, "B2_ACC1_MAX_GB", 9.5))
            ),
            BackblazeB2Provider(
                name="B2 Acc 2",
                endpoint=getattr(settings, "B2_ACC2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
                access_key=getattr(settings, "B2_ACC2_ACCESS_KEY", ""),
                secret_key=getattr(settings, "B2_ACC2_SECRET_KEY", ""),
                bucket_name=getattr(settings, "B2_ACC2_BUCKET", "streamflix-b2-2"),
                max_gb=float(getattr(settings, "B2_ACC2_MAX_GB", 9.5))
            ),
            BackblazeB2Provider(
                name="B2 Acc 3",
                endpoint=getattr(settings, "B2_ACC3_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
                access_key=getattr(settings, "B2_ACC3_ACCESS_KEY", ""),
                secret_key=getattr(settings, "B2_ACC3_SECRET_KEY", ""),
                bucket_name=getattr(settings, "B2_ACC3_BUCKET", "streamflix-b2-3"),
                max_gb=float(getattr(settings, "B2_ACC3_MAX_GB", 9.5))
            ),
            BackblazeB2Provider(
                name="B2 Acc 4",
                endpoint=getattr(settings, "B2_ACC4_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
                access_key=getattr(settings, "B2_ACC4_ACCESS_KEY", ""),
                secret_key=getattr(settings, "B2_ACC4_SECRET_KEY", ""),
                bucket_name=getattr(settings, "B2_ACC4_BUCKET", "streamflix-b2-4"),
                max_gb=float(getattr(settings, "B2_ACC4_MAX_GB", 9.5))
            )
        ]

        self.cdn_url = getattr(settings, "CLOUDFLARE_CDN_URL", "https://streamflix-cdn.a93767093.workers.dev")

    def get_available_storage_bucket(self, incoming_bytes: int) -> BackblazeB2Provider | None:
        for bucket in self.buckets:
            if bucket.can_fit(incoming_bytes):
                return bucket
        return None

    def get_cdn_stream_url(self, relative_s3_path: str) -> str:
        return f"{self.cdn_url}{relative_s3_path}"

storage_manager = StorageManager()