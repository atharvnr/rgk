from app.config import settings

_GMAIL_DOMAINS = {"gmail.com", "googlemail.com"}


def normalize_email(email: str) -> str:
    """Lowercase and strip; for Gmail addresses also drop dots and +suffix in the local part."""
    value = email.strip().lower()
    local, sep, domain = value.rpartition("@")
    if not sep:
        return value
    if domain in _GMAIL_DOMAINS:
        local = local.split("+", 1)[0].replace(".", "")
    return f"{local}@{domain}"


def is_root_email(email: str) -> bool:
    """True if the email matches an entry of settings.rgk_root_users after normalization."""
    target = normalize_email(email)
    return any(normalize_email(e) == target for e in settings.rgk_root_users)
