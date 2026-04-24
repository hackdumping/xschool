import os
import django
import json
from django.core.management import call_command
import io

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import set_bypass_tenant

# On force le système à ignorer le filtrage par école pour tout voir
set_bypass_tenant(True)

print("Exportation en cours, veuillez patienter...")

with open('donnees_completes.json', 'w', encoding='utf-8') as f:
    # On exporte tout sauf les données techniques et de sécurité
    call_command('dumpdata', 
                 exclude=['contenttypes', 'auth.permission', 'admin.logentry', 'sessions.session'],
                 natural_foreign=True, 
                 natural_primary=True, 
                 indent=2, 
                 stdout=f)

print("Succès ! Le fichier 'donnees_completes.json' a été généré avec TOUS les élèves.")
