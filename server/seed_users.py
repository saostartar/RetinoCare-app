"""
Script untuk menambahkan user default (dokter dan admin) ke database.
Jalankan dengan: python seed_users.py
"""

import os
import sys

# Tambahkan direktori app ke Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app, db
from app.models.user import User

def seed_users():
    """Menambahkan user default ke database."""
    
    app = create_app()
    
    with app.app_context():
        print("🔄 Memulai seeding users...")
        
        # Data user default
        default_users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "password123",
                "role": "admin"
            },
            {
                "username": "dokter",
                "email": "dokter@example.com", 
                "password": "password123",
                "role": "doctor"
            },
            {
                "username": "dr_budi",
                "email": "dr.budi@example.com",
                "password": "password123", 
                "role": "doctor"
            },
            {
                "username": "operator1",
                "email": "operator1@example.com",
                "password": "password123",
                "role": "operator"
            }
        ]
        
        users_created = 0
        users_skipped = 0
        
        for user_data in default_users:
            # Cek apakah user sudah ada berdasarkan email
            existing_user = User.query.filter_by(email=user_data["email"]).first()
            
            if existing_user:
                print(f"⚠️  User dengan email {user_data['email']} sudah ada. Melewati...")
                users_skipped += 1
                continue
            
            # Cek berdasarkan username juga
            existing_username = User.query.filter_by(username=user_data["username"]).first()
            if existing_username:
                print(f"⚠️  User dengan username {user_data['username']} sudah ada. Melewati...")
                users_skipped += 1
                continue
            
            # Buat user baru
            try:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    role=user_data["role"]
                )
                user.set_password(user_data["password"])
                
                db.session.add(user)
                db.session.commit()
                
                print(f"✅ User {user_data['username']} ({user_data['role']}) berhasil dibuat")
                users_created += 1
                
            except Exception as e:
                db.session.rollback()
                print(f"❌ Gagal membuat user {user_data['username']}: {str(e)}")
        
        print(f"\n📊 Ringkasan:")
        print(f"   - User baru dibuat: {users_created}")
        print(f"   - User dilewati: {users_skipped}")
        print(f"   - Total user di database: {User.query.count()}")
        
        # Tampilkan semua user yang ada
        print(f"\n👥 Daftar semua user:")
        all_users = User.query.all()
        for user in all_users:
            print(f"   - {user.username} ({user.email}) - Role: {user.role}")

if __name__ == "__main__":
    seed_users()