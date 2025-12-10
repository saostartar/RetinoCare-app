"""Add User.role + clinical models (Patient, Exam, EyeImage, ModelOutput)

Revision ID: d07991f7414f
Revises: 
Create Date: 2025-08-21 04:02:20.276185

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd07991f7414f'
down_revision = None
branch_labels = None
depends_on = None


def _has_table(insp, name: str) -> bool:
    return name in insp.get_table_names()


def _has_column(insp, table: str, column: str) -> bool:
    try:
        return any(c["name"] == column for c in insp.get_columns(table))
    except Exception:
        return False


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) Rename tabel legacy 'user' -> 'users' jika perlu (hindari DROP)
    if _has_table(insp, 'user') and not _has_table(insp, 'users'):
        # Putuskan FK dari detection_result -> user sebelum rename
        if _has_table(insp, 'detection_result'):
            fks = insp.get_foreign_keys('detection_result')
            for fk in fks:
                if fk.get('referred_table') == 'user':
                    with op.batch_alter_table('detection_result') as batch_op:
                        batch_op.drop_constraint(fk['name'], type_='foreignkey')
        # Rename aman, data tetap
        op.rename_table('user', 'users')

    # Refresh inspector setelah kemungkinan rename
    insp = sa.inspect(bind)

    # 2) Pastikan kolom 'role' ada di 'users'
    if _has_table(insp, 'users') and not _has_column(insp, 'users', 'role'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.add_column(sa.Column('role', sa.String(length=50), nullable=False, server_default='operator'))
        # Hapus server_default di level DB setelah migrasi awal
        with op.batch_alter_table('users') as batch_op:
            batch_op.alter_column('role', server_default=None)

    # 3) Jika 'users' kosong tetapi 'user' ada datanya, salin data dari 'user' -> 'users'
    insp = sa.inspect(bind)
    if _has_table(insp, 'users') and _has_table(insp, 'user'):
        # Hitung jumlah baris di users dan user
        users_count = bind.execute(sa.text("SELECT COUNT(*) FROM `users`")).scalar()
        user_count = bind.execute(sa.text("SELECT COUNT(*) FROM `user`")).scalar()

        if user_count > 0:
            # Pastikan kolom tujuan tersedia di 'users'
            users_cols = [c["name"] for c in insp.get_columns('users')]
            needed_cols = {'id', 'username', 'email', 'password_hash', 'role'}
            # Jika ada kolom yang belum ada (kecuali role sudah ditangani di langkah 2)
            missing = needed_cols.difference(users_cols)
            for col in missing:
                if col == 'username':
                    with op.batch_alter_table('users') as batch_op:
                        batch_op.add_column(sa.Column('username', sa.String(length=255), nullable=False))
                elif col == 'email':
                    with op.batch_alter_table('users') as batch_op:
                        batch_op.add_column(sa.Column('email', sa.String(length=255), nullable=False))
                elif col == 'password_hash':
                    with op.batch_alter_table('users') as batch_op:
                        batch_op.add_column(sa.Column('password_hash', sa.String(length=255), nullable=False))
                elif col == 'id':
                    # 'id' pasti ada karena primary key
                    pass
                elif col == 'role':
                    with op.batch_alter_table('users') as batch_op:
                        batch_op.add_column(sa.Column('role', sa.String(length=50), nullable=False, server_default='operator'))
                    with op.batch_alter_table('users') as batch_op:
                        batch_op.alter_column('role', server_default=None)

            # Salin data yang belum ada (berdasarkan id) dari 'user' ke 'users'
            # Role default: 'operator'
            insert_sql = """
                INSERT INTO `users` (id, username, email, password_hash, role)
                SELECT u.id, u.username, u.email, u.password_hash, COALESCE(u.role, 'operator')
                FROM `user` u
                LEFT JOIN `users` us ON us.id = u.id
                WHERE us.id IS NULL
            """
            # Jika tabel legacy 'user' tidak memiliki kolom role, gunakan SELECT tanpa u.role
            try:
                bind.execute(sa.text("SELECT 1 FROM `user` LIMIT 1"))  # probe
                has_user_role = any(c["name"] == "role" for c in insp.get_columns('user'))
            except Exception:
                has_user_role = False

            if not has_user_role:
                insert_sql = """
                    INSERT INTO `users` (id, username, email, password_hash, role)
                    SELECT u.id, u.username, u.email, u.password_hash, 'operator'
                    FROM `user` u
                    LEFT JOIN `users` us ON us.id = u.id
                    WHERE us.id IS NULL
                """

            bind.execute(sa.text(insert_sql))

            # Set AUTO_INCREMENT users ke max(id)+1
            max_id = bind.execute(sa.text("SELECT COALESCE(MAX(id), 0) FROM `users`")).scalar()
            next_ai = int(max_id) + 1
            bind.execute(sa.text(f"ALTER TABLE `users` AUTO_INCREMENT = {next_ai}"))

    # 4) Perbaiki FK detection_result -> users
    if _has_table(insp, 'detection_result'):
        # Putus semua FK eksisting pada detection_result
        fks = insp.get_foreign_keys('detection_result')
        for fk in fks:
            with op.batch_alter_table('detection_result') as batch_op:
                batch_op.drop_constraint(fk['name'], type_='foreignkey')

        # Tambahkan index untuk kolom user_id (baik untuk performa dan beberapa dialek MySQL)
        with op.batch_alter_table('detection_result') as batch_op:
            batch_op.create_index('ix_detection_result_user_id', ['user_id'], unique=False)
            batch_op.create_foreign_key(
                None,
                'users',
                ['user_id'],
                ['id'],
                ondelete=None
            )

    # 5) Buat tabel klinis jika belum ada
    insp = sa.inspect(bind)
    if not _has_table(insp, 'patients'):
        op.create_table(
            'patients',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('age', sa.Integer(), nullable=True),
            sa.Column('gender', sa.String(length=10), nullable=True),
            sa.Column('diabetes_duration_years', sa.Integer(), nullable=True),
            sa.Column('hypertension', sa.Boolean(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    insp = sa.inspect(bind)
    if not _has_table(insp, 'exams'):
        op.create_table(
            'exams',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id', ondelete=None), nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete=None), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='created'),
            sa.Column('result_summary', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    insp = sa.inspect(bind)
    if not _has_table(insp, 'eye_images'):
        op.create_table(
            'eye_images',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('exam_id', sa.Integer(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
            sa.Column('eye_side', sa.String(length=10), nullable=False, server_default='unknown'),
            sa.Column('file_path', sa.String(length=512), nullable=False),
            sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    insp = sa.inspect(bind)
    if not _has_table(insp, 'model_outputs'):
        op.create_table(
            'model_outputs',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('exam_id', sa.Integer(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
            sa.Column('dr_grade', sa.String(length=50), nullable=True),
            sa.Column('dr_probability', sa.Float(), nullable=True),
            sa.Column('heatmap_path', sa.String(length=512), nullable=True),
            sa.Column('raw_output', sa.JSON(), nullable=True),
            sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) Drop tabel klinis (child -> parent)
    if _has_table(insp, 'model_outputs'):
        op.drop_table('model_outputs')
    insp = sa.inspect(bind)
    if _has_table(insp, 'eye_images'):
        op.drop_table('eye_images')
    insp = sa.inspect(bind)
    if _has_table(insp, 'exams'):
        op.drop_table('exams')
    insp = sa.inspect(bind)
    if _has_table(insp, 'patients'):
        op.drop_table('patients')

    # 2) Putus FK detection_result
    insp = sa.inspect(bind)
    if _has_table(insp, 'detection_result'):
        fks = insp.get_foreign_keys('detection_result')
        for fk in fks:
            with op.batch_alter_table('detection_result') as batch_op:
                batch_op.drop_constraint(fk['name'], type_='foreignkey')
        with op.batch_alter_table('detection_result') as batch_op:
            batch_op.drop_index('ix_detection_result_user_id')

    # 3) Hapus kolom 'role' pada users jika ada
    insp = sa.inspect(bind)
    if _has_table(insp, 'users') and _has_column(insp, 'users', 'role'):
        with op.batch_alter_table('users') as batch_op:
            batch_op.drop_column('role')

    # 4) (Opsional) rename kembali users -> user jika diperlukan
    insp = sa.inspect(bind)
    if _has_table(insp, 'users') and not _has_table(insp, 'user'):
        op.rename_table('users', 'user')