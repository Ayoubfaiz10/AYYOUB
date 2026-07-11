# Reset user account - clears password & PIN
# Run: python reset_user.py
# Location: C:\Intel\B6\reset_user.py

import sqlite3, os, shutil

DB_PATH = os.path.join(os.environ['APPDATA'], 'lexoffece', 'lawyer.db')
BACKUP_PATH = DB_PATH + '.backup_before_reset'

print('=' * 50)
print('ACCOUNT RESET SCRIPT')
print('=' * 50)
print()
print('Database:', DB_PATH)
print()

if not os.path.exists(DB_PATH):
    print('ERROR: Database not found!')
    exit(1)

# Backup first
shutil.copy2(DB_PATH, BACKUP_PATH)
print('Backup created:', BACKUP_PATH)
print()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Show current users
cur.execute('SELECT id, name, email, role, active, password_hash FROM users')
rows = cur.fetchall()
cols = ['id', 'name', 'email', 'role', 'active', 'password_hash']

if not rows:
    print('No users found - account already reset!')
else:
    print('Current users:')
    for row in rows:
        print(f'  ID={row[0]}, name={row[1]}, email={row[2]}, role={row[3]}, active={row[4]}')

    print()
    print('Resetting ALL accounts (clearing passwords and PINs)...')

    # Clear passwords and PINs, deactivate all users
    cur.execute('UPDATE users SET password_hash = NULL, pin_hash = NULL, active = 0')
    print('Updated rows:', cur.rowcount)

    # Also clear office settings to force fresh setup
    cur.execute('DELETE FROM office_settings')
    print('Cleared office settings')

    conn.commit()
    print()
    print('SUCCESS! Account has been reset.')
    print()
    print('Next time you open the app, it will show the setup screen.')
    print('You can create a new account with a new password and PIN.')

conn.close()
print()
print('=' * 50)
