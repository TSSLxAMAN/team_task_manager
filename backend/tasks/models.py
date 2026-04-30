from django.db import models
from django.utils.text import slugify
from accounts.models import User
from projects.models import Project


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'Todo'),
        ('in_progress', 'In Progress'),
        ('under_review', 'Under Review'),
        ('done', 'Done'),
        ('sent_back', 'Sent Back'),
    ]
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.CASCADE, related_name='subtasks'
    )
    task_number = models.PositiveIntegerField(editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    branch_name = models.CharField(max_length=200, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    assigned_to = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    estimate_hours = models.PositiveIntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    elapsed_seconds = models.PositiveIntegerField(default=0)
    mr_link = models.URLField(blank=True)
    completion_notes = models.TextField(blank=True)
    send_back_reason = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['task_number']
        unique_together = [['project', 'task_number']]

    def save(self, *args, **kwargs):
        if not self.pk:
            last = Task.objects.filter(project=self.project).order_by('-task_number').first()
            self.task_number = (last.task_number + 1) if last else 1
        if not self.branch_name:
            slug = slugify(self.title)[:40].strip('-')
            self.branch_name = f"feature/{self.task_number}-{slug}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.task_number} {self.title}"
