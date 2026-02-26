"""
Seed script for OptimizeFlow.
Creates demo organization, users, locations, and appointment types.

Run with: python -m app.seed
"""

import asyncio
import sys
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine, Base
from app.models.organization import Organization
from app.models.user import User
from app.models.location import Location, user_locations
from app.models.appointment_type import AppointmentType
from app.services.auth_service import hash_password


# Seed data definitions
ORGANIZATION = {
    "name": "Smith Health System",
    "slug": "smith-health",
}

USERS = [
    {
        "email": "admin@optimizeflow.com",
        "password": "admin123",
        "full_name": "Admin User",
        "role": "clinic_admin",
    },
    {
        "email": "manager@optimizeflow.com",
        "password": "manager123",
        "full_name": "Clinic Manager",
        "role": "clinic_manager",
    },
]

LOCATIONS = [
    "Asheville",
    "Chapel Hill",
    "Charlotte",
    "Greensboro",
    "Hickory",
    "Main Campus - East",
    "Main Campus - South",
    "Main Campus - West",
    "Page Road Eye Center",
    "Raleigh",
    "Statesville",
    "Wilmington",
]

APPOINTMENT_TYPES = {
    "New Patient": Decimal("2"),
    "Return Visit": Decimal("1.5"),
    "Urgent": Decimal("1.5"),
    "Inmates": Decimal("2"),
    "Return Contact Lens": Decimal("1.5"),
    "Specialty Lens Fitting": Decimal("1.5"),
    "Post-Op 1 Day": Decimal("1"),
    "Post-Op": Decimal("1"),
    "New Contact Lens": Decimal("2"),
    "Botox": Decimal("2"),
    "New Neuro-Opthalmology": Decimal("2"),
    "Return Neuro": Decimal("1.5"),
    "Studies Only-Ophthalmology": Decimal("1.5"),
    "Laser": Decimal("2"),
    "New Cataract Evaluation": Decimal("3"),
    "Tech Only": Decimal("1.5"),
    "Post-Op Month": Decimal("1"),
    "Injection": Decimal("2"),
    "New Visual Field": Decimal("3"),
    "New Adult Eye Patient": Decimal("2"),
    "New Lasik": Decimal("2"),
    "Return Visual Field": Decimal("1.5"),
    "Procedure": Decimal("2"),
    "Visual Acuity": Decimal("1.5"),
    "New Cataract": Decimal("3"),
    "New Glaucoma": Decimal("3"),
    "Dry Eye Consult": Decimal("3"),
    "New Cornea": Decimal("2"),
    "Procedure (With Copay)": Decimal("2"),
    "Complete Eye Exam": Decimal("2"),
    "Cosmetic": Decimal("2"),
    "Cpc": Decimal("2"),
    "New Cicatricial Pemphigoid": Decimal("2"),
    "New Tumor": Decimal("3"),
    "Injection-Retina": Decimal("2"),
    "Return Uveitis": Decimal("1.5"),
    "Return Long": Decimal("1.5"),
    "New Uveitis": Decimal("2"),
    "Driving Eval": Decimal("1"),
    "New Photodynamic Therapy": Decimal("2"),
    "Return Tumor": Decimal("1.5"),
    "Return Photodynamic Therapy": Decimal("1.5"),
    "New Nicu Baby": Decimal("2"),
    "Evaluation": Decimal("2"),
    "Surgical Work Up": Decimal("2"),
    "Return Dry Eye": Decimal("1.5"),
    "Minor Room": Decimal("2"),
    "Office Visit": Decimal("2"),
}

# Locations to assign to the clinic manager
MANAGER_LOCATIONS = ["Asheville", "Chapel Hill", "Charlotte"]


async def seed_database():
    """Seed the database with initial data."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Checking if seed data already exists...")

            # Check if organization already exists
            existing_org = await session.execute(
                select(Organization).where(Organization.slug == ORGANIZATION["slug"])
            )
            if existing_org.scalar_one_or_none():
                print("Seed data already exists. Skipping.")
                return

            print("Seeding database...")

            # 1. Create organization
            org = Organization(**ORGANIZATION)
            session.add(org)
            await session.flush()
            print(f"  Created organization: {org.name} (ID: {org.id})")

            # 2. Create users
            created_users = {}
            for user_data in USERS:
                user = User(
                    organization_id=org.id,
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                )
                session.add(user)
                await session.flush()
                created_users[user_data["email"]] = user
                print(f"  Created user: {user.email} ({user.role})")

            # 3. Create locations
            created_locations = {}
            for loc_name in LOCATIONS:
                location = Location(
                    organization_id=org.id,
                    name=loc_name,
                )
                session.add(location)
                await session.flush()
                created_locations[loc_name] = location
                print(f"  Created location: {loc_name}")

            # 4. Create appointment types
            for name, points in APPOINTMENT_TYPES.items():
                appt_type = AppointmentType(
                    organization_id=org.id,
                    name=name,
                    point_value=points,
                )
                session.add(appt_type)

            await session.flush()
            print(f"  Created {len(APPOINTMENT_TYPES)} appointment types")

            # 5. Assign clinic manager to locations
            manager = created_users.get("manager@optimizeflow.com")
            if manager:
                for loc_name in MANAGER_LOCATIONS:
                    location = created_locations.get(loc_name)
                    if location:
                        await session.execute(
                            user_locations.insert().values(
                                user_id=manager.id,
                                location_id=location.id,
                            )
                        )
                print(
                    f"  Assigned manager to locations: {', '.join(MANAGER_LOCATIONS)}"
                )

            print("\nSeed completed successfully!")
            print(f"\n  Admin login: admin@optimizeflow.com / admin123")
            print(f"  Manager login: manager@optimizeflow.com / manager123")


async def main():
    """Entry point for the seed script."""
    try:
        await seed_database()
    except Exception as e:
        print(f"Seed failed: {e}", file=sys.stderr)
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
