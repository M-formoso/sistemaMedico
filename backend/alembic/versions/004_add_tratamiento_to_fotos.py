"""Add tratamiento_id to fotos table

Revision ID: 004
Revises: 003
Create Date: 2024-03-10

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar columna tratamiento_id a la tabla fotos
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='fotos' AND column_name='tratamiento_id') THEN
                ALTER TABLE fotos ADD COLUMN tratamiento_id INTEGER REFERENCES tratamientos(id);
            END IF;
        END $$;
    """)

    # Crear índice para tratamiento_id
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_fotos_tratamiento_id') THEN
                CREATE INDEX ix_fotos_tratamiento_id ON fotos(tratamiento_id);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_fotos_tratamiento_id') THEN
                DROP INDEX ix_fotos_tratamiento_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='fotos' AND column_name='tratamiento_id') THEN
                ALTER TABLE fotos DROP COLUMN tratamiento_id;
            END IF;
        END $$;
    """)
