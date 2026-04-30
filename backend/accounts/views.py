from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().order_by('name')
        return Response(UserSerializer(users, many=True).data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from projects.models import Project
        from tasks.models import Task
        from django.utils import timezone

        user = request.user
        today = timezone.now().date()

        if user.role == 'admin':
            my_projects = Project.objects.all()
            all_tasks = Task.objects.all()
        else:
            my_projects = user.projects.all()
            all_tasks = Task.objects.filter(assigned_to=user)

        my_tasks = Task.objects.filter(assigned_to=user).exclude(status='done')
        review_queue = Task.objects.filter(status='under_review')
        overdue = all_tasks.filter(due_date__lt=today).exclude(status='done')

        from projects.serializers import ProjectSerializer
        from tasks.serializers import TaskSerializer

        return Response({
            'projects_count': my_projects.count(),
            'my_tasks_count': my_tasks.count(),
            'review_queue_count': review_queue.count() if user.role == 'admin' else my_tasks.filter(status='under_review').count(),
            'overdue_count': overdue.count(),
            'my_tasks': TaskSerializer(my_tasks[:5], many=True, context={'request': request}).data,
            'projects': ProjectSerializer(my_projects[:5], many=True, context={'request': request}).data,
        })
