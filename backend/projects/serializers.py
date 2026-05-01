from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        source='members', many=True, read_only=True
    )
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'readme', 'color',
            'created_by', 'members_detail', 'member_ids',
            'stats', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_stats(self, obj):
        return obj.get_stats()


class ProjectCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=[]
    )

    class Meta:
        model = Project
        fields = ['name', 'description', 'color', 'member_ids']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        request = self.context['request']
        project = Project.objects.create(created_by=request.user, **validated_data)
        project.members.add(request.user)
        if member_ids:
            from accounts.models import User
            project.members.add(*User.objects.filter(id__in=member_ids))
        return project
