"""cleanup legacy user and indexes

Revision ID: 68dc1ffda132
Revises: d07991f7414f
Create Date: 2025-08-22 06:00:50.621146

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '68dc1ffda132'
down_revision = 'd07991f7414f'
branch_labels = None
depends_on = None


def _has_table(insp, name: str) -> bool:
    try:
        return name in insp.get_table_names()
    except Exception:
        return False


def _has_column(insp, table: str, column: str) -> bool:
    try:
        return any(c["name"] == column for c in insp.get_columns(table))
    except Exception:
        return False


def _has_index(insp, table: str, index_name: str) -> bool:
    try:
        return any(ix["name"] == index_name for ix in insp.get_indexes(table))
    except Exception:
        return False


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) Pastikan tabel users ada (fase sebelumnya sudah membuat/rename)
    if not _has_table(insp, 'users'):
        # Jika masih ada legacy 'user', rename sekarang
        if _has_table(insp, 'user'):
            op.rename_table('user', 'users')
        else:
            # Buat minimal schema jika benar-benar belum ada (skenario edge)
            op.create_table(
                'users',
                sa.Column('id', sa.Integer(), primary_key=True),
                sa.Column('username', sa.String(length=255), nullable=False),
                sa.Column('email', sa.String(length=255), nullable=False),
                sa.Column('password_hash', sa.String(length=255), nullable=False),
                sa.Column('role', sa.String(length=50), nullable=False, server_default='operator'),
            )
            with op.batch_alter_table('users') as batch_op:
                batch_op.alter_column('role', server_default=None)

    insp = sa.inspect(bind)

    # 2) Tambah kolom wajib jika belum ada, dan pastikan NOT NULL
    required_cols = [
        ('username', sa.String(length=255)),
        ('email', sa.String(length=255)),
        ('password_hash', sa.String(length=255)),
        ('role', sa.String(length=50)),
    ]
    for name, coltype in required_cols:
        if not _has_column(insp, 'users', name):
            with op.batch_alter_table('users') as batch_op:
                # default sementara hanya untuk pengisian awal, langsung dihapus
                server_default = 'operator' if name == 'role' else None
                batch_op.add_column(sa.Column(name, coltype, nullable=False, server_default=server_default))
            if name == 'role':
                with op.batch_alter_table('users') as batch_op:
                    batch_op.alter_column('role', server_default=None)

    # Pastikan kolom NOT NULL (jika skema lama terlanjur nullable)
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('username', existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column('email', existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column('role', existing_type=sa.String(length=50), nullable=False)

    # 3) Isi nilai role yang mungkin NULL -> 'operator'
    bind.execute(sa.text("UPDATE `users` SET `role` = 'operator' WHERE `role` IS NULL"))

    # 4) Tambah index unik untuk username dan email jika belum ada
    insp = sa.inspect(bind)
    if not _has_index(insp, 'users', 'ux_users_username'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.create_index('ux_users_username', ['username'], unique=True)
    if not _has_index(insp, 'users', 'ux_users_email'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.create_index('ux_users_email', ['email'], unique=True)

    # 5) Normalisasi FK detection_result.user_id -> users.id
    if _has_table(insp, 'detection_result'):
        # Putus semua FK yang ada dahulu
        fks = insp.get_foreign_keys('detection_result')
        for fk in fks:
            with op.batch_alter_table('detection_result') as batch_op:
                batch_op.drop_constraint(fk['name'], type_='foreignkey')

        # Tambah index untuk user_id jika belum ada
        if not _has_index(insp, 'detection_result', 'ix_detection_result_user_id'):
            with op.batch_alter_table('detection_result') as batch_op:
                batch_op.create_index('ix_detection_result_user_id', ['user_id'], unique=False)

        # Tambah FK baru yang bernama jelas (tanpa ondelete agar aman untuk MySQL lama)
        with op.batch_alter_table('detection_result') as batch_op:
            batch_op.create_foreign_key(
                'fk_detection_result_user_id_users',
                'users',
                ['user_id'],
                ['id'],
                ondelete=None
            )

    # 6) Drop legacy table 'user' jika masih ada
    insp = sa.inspect(bind)
    if _has_table(insp, 'user'):
        op.drop_table('user')


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) Kembalikan tabel legacy 'user' jika belum ada
    if not _has_table(insp, 'user'):
        op.create_table(
            'user',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('username', sa.String(length=255), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('role', sa.String(length=50), nullable=False, server_default='operator'),
        )
        # Salin data dari users -> user
        bind.execute(sa.text("""
            INSERT INTO `user` (id, username, email, password_hash, role)
            SELECT id, username, email, password_hash, COALESCE(role, 'operator')
            FROM `users`
        """))
        # Hilangkan default server setelah penyalinan
        with op.batch_alter_table('user') as batch_op:
            batch_op.alter_column('role', server_default=None)

    # 2) Ubah FK detection_result ke legacy user
    if _has_table(insp, 'detection_result'):
        fks = insp.get_foreign_keys('detection_result')
        for fk in fks:
            with op.batch_alter_table('detection_result') as batch_op:
                batch_op.drop_constraint(fk['name'], type_='foreignkey')
        with op.batch_alter_table('detection_result') as batch_op:
            # index dibiarkan ada
            batch_op.create_foreign_key(
                'fk_detection_result_user_id_user',
                'user',
                ['user_id'],
                ['id'],
                ondelete=None
            )

    # 3) Hapus index unik pada users (simetris)
    insp = sa.inspect(bind)
    if _has_index(insp, 'users', 'ux_users_username'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.drop_index('ux_users_username')
    if _has_index(insp, 'users', 'ux_users_email'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.drop_index('ux_users_email')