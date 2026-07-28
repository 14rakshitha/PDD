import ssl
import socket

host = "aws-0-ap-northeast-2.pooler.supabase.com"
project_ref = "bqmwqxyjzipuitrqkgff"
password = "rakshi14@baskaran"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

opts = [
    f"reference={project_ref}",
    f"project={project_ref}",
    f"tenant={project_ref}"
]

for port in [5432, 6543]:
    for opt in opts:
        try:
            s = socket.create_connection((host, port), timeout=3)
            ssl_packet = (8).to_bytes(4, 'big') + (80877103).to_bytes(4, 'big')
            s.sendall(ssl_packet)
            resp = s.recv(1)
            if resp == b'S':
                ssl_sock = ctx.wrap_socket(s, server_hostname=f"db.{project_ref}.supabase.co")
                user_bytes = f"user\x00postgres\x00database\x00postgres\x00options\x00{opt}\x00\x00".encode('utf-8')
                packet_len = 4 + 4 + len(user_bytes)
                packet = packet_len.to_bytes(4, 'big') + (196608).to_bytes(4, 'big') + user_bytes
                ssl_sock.sendall(packet)
                res_auth = ssl_sock.recv(1024).decode('latin-1', errors='ignore')
                print(f"Port {port} opt '{opt}': {res_auth[:120]}")
                ssl_sock.close()
        except Exception as e:
            print(f"Err Port {port} opt '{opt}': {e}")
