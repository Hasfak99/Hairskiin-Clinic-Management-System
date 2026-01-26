# Login Troubleshooting Guide

## ✅ Verified Working Credentials

All users have been tested and authentication is working correctly:

| Role | Username | Password | Status |
|------|----------|----------|--------|
| Admin | `admin` | `admin123` | ✅ Working |
| Receptionist | `reception` | `reception123` | ✅ Working |
| Manager | `manager` | `manager123` | ✅ Working |

## ⚠️ Common Issues

### Issue 1: Wrong Username
**Problem**: Trying to login with `receptionist` instead of `reception`

**Solution**: Use the username `reception` (not `receptionist`)

### Issue 2: User Not Created
**Problem**: User doesn't exist in database

**Solution**: Run the seed script:
```bash
cd server
venv\Scripts\activate
python seed.py
```

### Issue 3: Password Verification Failing
**Problem**: Password hash mismatch

**Solution**: Recreate the user with correct password hash:
```bash
python seed.py
```

## 🔍 Testing Login

To test if login works, run:
```bash
python test_login.py
```

This will verify authentication for all users.

## 📝 Notes

- All users have `branch_id = None` by default (this is normal)
- Users must have `status = "active"` to login
- Password hashing uses `sha256_crypt` scheme
