import os
import django
import sys

# Setup django
sys.path.append('/home/dumping/Documents/projet/xschool/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from school.models import SchoolYear, Class, Student
from finance.models import Payment, TrancheConfig

def cleanup():
    print("Starting data cleanup...")

    # 1. Update SchoolYear format (- to /)
    for sy in SchoolYear.objects.all():
        if '-' in sy.year:
            old_year = sy.year
            new_year = sy.year.replace('-', '/')
            print(f"Updating SchoolYear: {old_year} -> {new_year}")
            sy.year = new_year
            sy.save()

    # 2. Fix redundant Class names and Merge Duplicates
    all_years = SchoolYear.objects.all()
    for sy in all_years:
        print(f"\nProcessing year: {sy.year}")
        classes = Class.objects.filter(school_year=sy)
        
        seen_levels = {} # level -> class_object
        
        for c in classes:
            # Clean name (it was like "6ème (6ème)")
            c.name = c.level 
            c.save()
            
            if c.level in seen_levels:
                # Duplicate found! Merge this one into the first one
                primary = seen_levels[c.level]
                print(f"  Merging duplicate class: {c.id} into {primary.id} (Level: {c.level})")
                
                # Reassign students
                students_count = Student.objects.filter(school_class=c).update(school_class=primary)
                print(f"    Reassigned {students_count} students.")
                
                # Reassign payments if any are linked to class directly (unlikely based on model, but safe)
                # re-syncing tuition template handles payments usually
                
                # Delete the duplicate
                c.delete()
            else:
                seen_levels[c.level] = c
                print(f"  Kept class: {c.id} (Level: {c.level})")

    print("\nCleanup complete.")

if __name__ == "__main__":
    cleanup()
