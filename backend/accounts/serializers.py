from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from allauth.account.adapter import get_adapter
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role']
        read_only_fields = ['id']


class RegisterSerializer(BaseRegisterSerializer):
    name = serializers.CharField(max_length=100)
    role = serializers.ChoiceField(choices=['admin', 'member'], default='member')
    username = None

    def get_cleaned_data(self):
        return {
            'name': self.validated_data.get('name', ''),
            'role': self.validated_data.get('role', 'member'),
            'password1': self.validated_data.get('password1', ''),
            'email': self.validated_data.get('email', ''),
        }

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        user.name = self.cleaned_data.get('name')
        user.role = self.cleaned_data.get('role')
        adapter.save_user(request, user, self)
        return user
