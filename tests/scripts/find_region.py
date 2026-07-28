import ssl
import socket

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "sa-east-1", "ca-central-1", "me-central-1"
]

project_ref = "bqmwqxyjzipuitrqkgff"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    try:
        s = socket.create_connection((host, 6543), timeout=3)
        ssl_packet = (8).to_bytes(4, 'big') + (80877103).to_bytes(4, 'big')
        s.sendall(ssl_packet)
        resp = s.recv(1)
        if resp == b'S':
            ssl_sock = ctx.wrap_socket(s, server_hostname=f"db.{project_ref}.supabase.co")
            user_bytes = f"user\x00postgres\x00database\x00postgres\x00options\x00reference={project_ref}\x00\x00".encode('utf-8')
            packet_len = 4 + 4 + len(user_bytes)
            packet = packet_len.to_bytes(4, 'big') + (196608).to_bytes(4, 'big') + user_bytes
            ssl_sock.sendall(packet)
            res_auth = ssl_sock.recv(1024).decode('latin-1', errors='ignore')
            ssl_sock.close()
            if "ENOTFOUND" not in res_auth:
                print(f"✅ FOUND MATCHING REGION! -> {r} ({host}): {res_auth[:100]}")
            else:
                print(f"Region {r}: not found")
    except Exception as e:
        print(f"Region {r}: {e}")
