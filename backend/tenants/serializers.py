from rest_framework import serializers
from .models import Establishment

class EstablishmentSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.get_full_name')
    owner_username = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = Establishment
        fields = ('id', 'name', 'selected_types', 'address', 'phone', 'email', 'logo', 'owner', 'owner_name', 'owner_username')
        read_only_fields = ('id', 'owner')

    def validate_selected_types(self, value):
        valid_types = [t[0] for t in Establishment.TYPES]
        if not value:
            raise serializers.ValidationError("Vous devez choisir au moins un type d'établissement.")
        for t in value:
            if t not in valid_types:
                raise serializers.ValidationError(f"Type d'établissement invalide : {t}")
        return value
