from rest_framework import serializers
from .models import User, Notification
from school.models import SchoolConfiguration
import re

class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'firstName', 'lastName', 'role', 'avatar')
        read_only_fields = ('id',)

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        
        # Security Policy Enforcement
        config = SchoolConfiguration.objects.first()
        if config:
            password = data['password']
            
            # 1. Min Length
            if len(password) < config.min_password_length:
                raise serializers.ValidationError(f"Le mot de passe doit contenir au moins {config.min_password_length} caractères.")
            
            # 2. Complexity (if required)
            if config.require_strong_password:
                if not re.search(r'[A-Z]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
                if not re.search(r'[0-9]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
                if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins un caractère spécial.")
        
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(role='professeur', **validated_data)
        user.set_password(password)
        user.save()
        return user

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
