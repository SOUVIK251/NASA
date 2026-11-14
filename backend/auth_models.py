"""
Authentication Database Models for Flame in Freefall.
Manages users, email verification tokens, and login audit log.
"""

import sqlite3
import os

AUTH_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth.db")


def get_auth_db() -> sqlite3.Connection:
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_auth_db():
    """Initialize all auth-related tables."""
    conn = get_auth_db()
    c = conn.cursor()

    # Users table
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            email           TEXT    UNIQUE NOT NULL COLLATE NOCASE,
            password_hash   TEXT    NOT NULL,
            is_verified     INTEGER NOT NULL DEFAULT 0,
            is_admin        INTEGER NOT NULL DEFAULT 0,
            is_locked       INTEGER NOT NULL DEFAULT 0,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until    TEXT    DEFAULT NULL,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            last_login      TEXT    DEFAULT NULL
        );
    """)

    # Email verification OTP table
    c.execute("""
        CREATE TABLE IF NOT EXISTS email_verifications (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT    NOT NULL COLLATE NOCASE,
            otp        TEXT    NOT NULL,
            expires_at TEXT    NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        );
    """)

    # Login audit log
    c.execute("""
        CREATE TABLE IF NOT EXISTS login_audit (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT    NOT NULL,
            success    INTEGER NOT NULL DEFAULT 0,
            ip_address TEXT    DEFAULT NULL,
            user_agent TEXT    DEFAULT NULL,
            timestamp  TEXT    NOT NULL DEFAULT (datetime('now'))
        );
    """)

    conn.commit()
    conn.close()
    print("[Auth] Auth database initialized successfully.")
