from rest_framework import serializers
from django.utils import timezone
from accounts.serializers import UserSerializer
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    subtasks = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_color = serializers.CharField(source='project.color', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'task_number', 'title', 'description', 'branch_name',
            'priority', 'status', 'project', 'project_name', 'project_color',
            'parent', 'assigned_to', 'assigned_to_detail',
            'created_by', 'created_by_detail',
            'estimate_hours', 'due_date',
            'started_at', 'elapsed_seconds',
            'mr_link', 'completion_notes', 'send_back_reason',
            'completed_at', 'created_at', 'updated_at',
            'subtasks', 'is_overdue',
        ]
        read_only_fields = ['id', 'task_number', 'branch_name', 'created_by', 'created_at', 'updated_at']

    def get_subtasks(self, obj):
        if obj.subtasks.exists():
            return TaskSerializer(obj.subtasks.all(), many=True, context=self.context).data
        return []

    def get_is_overdue(self, obj):
        if obj.status == 'done' or not obj.due_date:
            return False
        return obj.due_date < timezone.now().date()


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority',
            'assigned_to', 'estimate_hours', 'due_date', 'parent',
        ]

    def validate_due_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value

    def validate_assigned_to(self, value):
        project = self.context['project']
        if value and not project.members.filter(id=value.id).exists():
            raise serializers.ValidationError('Assigned user must be a project member.')
        return value

    def validate_parent(self, value):
        project = self.context['project']
        if value and value.project != project:
            raise serializers.ValidationError('Parent task must belong to the same project.')
        return value

    def create(self, validated_data):
        project = self.context['project']
        request = self.context['request']
        return Task.objects.create(project=project, created_by=request.user, **validated_data)


class TaskStartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status', 'started_at']
        read_only_fields = ['status', 'started_at']


class TaskSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['mr_link', 'completion_notes', 'elapsed_seconds']

    def validate_mr_link(self, value):
        if not value:
            raise serializers.ValidationError('MR link is required.')
        return value

    def validate_completion_notes(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError('Please describe what you did (min 10 chars).')
        return value
