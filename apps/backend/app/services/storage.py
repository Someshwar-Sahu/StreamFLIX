import boto3
import time
from boto3.s3.transfer import TransferConfig
from pathlib import Path
from botocore.config import Config
from app.core.config import settings

# High-throughput multi-part S3 transfer configuration (10 parallel threads, 16MB chunk size)
B2_TRANSFER_CONFIG = TransferConfig(
    multipart_threshold=8 * 1024 * 1024,
    max_concurrency=10,
    multipart_chunksize=16 * 1024 * 1024,
    use_threads=True
)

class BackblazeB2Provider:
    def __init__(self, name: str, endpoint: str, access_key: str, secret_key: str, bucket_name: str, max_gb: float):
        self.name = name
        self.bucket_name = bucket_name
        self.max_bytes = int(max_gb * 1024 * 1024 * 1024)
        clean_ep = endpoint.strip() if endpoint else ""
        if clean_ep and not clean_ep.startswith("http"):
            clean_ep = f"https://{clean_ep}"
        self.endpoint = clean_ep or "https://s3.us-east-005.backblazeb2.com"
        self._cached_used_bytes = 0
        self._last_size_check = 0

        self.client = None
        if access_key and secret_key:
            try:
                self.client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint,
                    aws_access_key_id=access_key.strip(),
                    aws_secret_access_key=secret_key.strip(),
                    region_name="us-east-005",
                    config=Config(signature_version="s3v4")
                )
                try:
                    cors_config = {
                        'CORSRules': [{
                            'AllowedHeaders': ['*'],
                            'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
                            'AllowedOrigins': ['*'],
                            'MaxAgeSeconds': 3600
                        }]
                    }
                    self.client.put_bucket_cors(Bucket=self.bucket_name, CORSConfiguration=cors_config)
                except Exception as e:
                    print(f"B2 CORS setup note for {self.name}: {e}")
            except Exception as e:
                print(f"Failed to initialize S3 client for {self.name}: {e}")

    def get_used_bytes(self) -> int:
        if not self.client:
            return 0
        now = time.time()
        # Cache bucket size for 60 seconds to eliminate network latency on upload checks
        if now - self._last_size_check < 60 and self._cached_used_bytes > 0:
            return self._cached_used_bytes

        try:
            paginator = self.client.get_paginator("list_objects_v2")
            total_size = 0
            for page in paginator.paginate(Bucket=self.bucket_name):
                if "Contents" in page:
                    for obj in page["Contents"]:
                        total_size += obj["Size"]
            self._cached_used_bytes = total_size
            self._last_size_check = now
            return total_size
        except Exception as e:
            print(f"Error checking size for {self.name}: {e}")
            return self._cached_used_bytes

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
            Config=B2_TRANSFER_CONFIG,
            ExtraArgs={"ContentType": content_type}
        )
        return f"/{self.bucket_name}/{s3_key}"

    def generate_presigned_url(self, s3_key: str, content_type: str | None = "video/mp4", expires_in: int = 3600) -> str:
        if not self.client:
            raise RuntimeError(f"Storage provider {self.name} is not initialized.")
        clean_content_type = content_type.strip() if (content_type and content_type.strip()) else "video/mp4"
        return self.client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": s3_key,
                "ContentType": clean_content_type,
            },
            ExpiresIn=expires_in,
        )

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

    def generate_presigned_upload(self, s3_key: str, incoming_bytes: int, content_type: str = "video/mp4") -> dict | None:
        bucket = self.get_available_storage_bucket(incoming_bytes)
        if not bucket or not bucket.client:
            return None
        url = bucket.generate_presigned_url(s3_key, content_type=content_type)
        return {
            "upload_url": url,
            "bucket_name": bucket.bucket_name,
            "s3_key": s3_key,
            "relative_path": f"/{bucket.bucket_name}/{s3_key}"
        }

storage_manager = StorageManager()