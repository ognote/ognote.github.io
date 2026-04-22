# Python virtual env `[venv]`

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

---

If you want, I can give you a **one-command setup alias** or a **template for exploit environments**.


## Table of Contents
1. [Reconnaissance & Enumeration](#1-reconnaissance--enumeration)
2. [HTTP / HTTPS](#2-http--https)
3. [SSH](#3-ssh)
4. [FTP](#4-ftp)
5. [SMB](#5-smb)
6. [NFS](#6-nfs)
7. [DNS](#7-dns)
8. [SMTP](#8-smtp)
9. [POP3 / IMAP](#9-pop3--imap)
10. [MySQL](#10-mysql)
11. [PostgreSQL](#11-postgresql)
12. [MongoDB](#12-mongodb)
13. [Redis](#13-redis)
14. [RDP](#14-rdp)
15. [VNC](#15-vnc)
16. [Telnet](#16-telnet)
17. [LDAP](#17-ldap)
18. [SNMP](#18-snmp)
19. [Kerberos](#19-kerberos)
20. [Exploitation & Shells](#20-exploitation--shells)
21. [Privilege Escalation — Linux](#21-privilege-escalation--linux)
22. [Privilege Escalation — Windows](#22-privilege-escalation--windows)
23. [Password Attacks](#23-password-attacks)
24. [File Transfers](#24-file-transfers)
25. [Pivoting & Tunneling](#25-pivoting--tunneling)
26. [Active Directory Attacks](#26-active-directory-attacks)
27. [Post Exploitation](#27-post-exploitation)
28. [Buffer Overflow (32-bit Linux/Windows)](#28-buffer-overflow-32-bit)
29. [Antivirus Evasion](#29-antivirus-evasion)
30. [Useful One-Liners & Miscellaneous](#30-useful-one-liners--miscellaneous)

---