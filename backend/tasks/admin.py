from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['task_number', 'title', 'project', 'assigned_to', 'status', 'priority', 'due_date']
    list_filter = ['status', 'priority', 'project']
    search_fields = ['title', 'description']
    ordering = ['project', 'task_number']
