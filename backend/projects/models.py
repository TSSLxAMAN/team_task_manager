from django.db import models
from accounts.models import User

PROJECT_COLORS = [
    '#D97706', '#2563EB', '#16A34A', '#7C3AED',
    '#DB2777', '#0891B2', '#CA8A04', '#EA580C',
]


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    readme = models.TextField(blank=True, default='')
    color = models.CharField(max_length=20, default='#D97706')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    members = models.ManyToManyField(User, related_name='projects', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_stats(self):
        tasks = self.tasks.all()
        done = tasks.filter(status='done').count()
        review = tasks.filter(status='under_review').count()
        from django.utils import timezone
        overdue = tasks.exclude(status='done').filter(due_date__lt=timezone.now().date()).count()
        return {
            'total': tasks.count(),
            'done': done,
            'review': review,
            'overdue': overdue,
        }
