from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from projects.models import Project
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, TaskSubmitSerializer


def get_project_or_404(pk, user):
    try:
        if user.role == 'admin':
            return Project.objects.get(pk=pk)
        return user.projects.get(pk=pk)
    except Project.DoesNotExist:
        return None


class ProjectTaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        project = get_project_or_404(project_pk, request.user)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        top_tasks = Task.objects.filter(project=project, parent=None)
        return Response(TaskSerializer(top_tasks, many=True, context={'request': request}).data)

    def post(self, request, project_pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can create tasks.'}, status=403)
        project = get_project_or_404(project_pk, request.user)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = TaskCreateSerializer(
            data=request.data,
            context={'request': request, 'project': project}
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task, context={'request': request}).data, status=201)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Task.objects.all()
        return Task.objects.filter(project__in=user.projects.all())

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can edit tasks.'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can delete tasks.'}, status=403)
        return super().destroy(request, *args, **kwargs)


class TaskStartView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if task.assigned_to != request.user and request.user.role != 'admin':
            return Response({'detail': 'Not allowed.'}, status=403)

        if task.status not in ['todo', 'sent_back']:
            return Response({'detail': 'Task must be in todo or sent_back to start.'}, status=400)

        task.status = 'in_progress'
        task.started_at = timezone.now()
        task.save()
        return Response(TaskSerializer(task, context={'request': request}).data)


class TaskSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if task.assigned_to != request.user:
            return Response({'detail': 'Only the assigned member can submit.'}, status=403)

        if task.status != 'in_progress':
            return Response({'detail': 'Task must be in progress to submit.'}, status=400)

        serializer = TaskSubmitSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(status='under_review')
        return Response(TaskSerializer(task, context={'request': request}).data)


class TaskCloseView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can close tasks.'}, status=403)
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if task.status != 'under_review':
            return Response({'detail': 'Task must be under review to close.'}, status=400)

        task.status = 'done'
        task.completed_at = timezone.now()
        task.save()
        return Response(TaskSerializer(task, context={'request': request}).data)


class TaskReopenView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can send back tasks.'}, status=403)
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if task.status != 'under_review':
            return Response({'detail': 'Task must be under review to send back.'}, status=400)

        reason = request.data.get('reason', '')
        task.status = 'sent_back'
        task.send_back_reason = reason
        task.save()
        return Response(TaskSerializer(task, context={'request': request}).data)


class ReviewQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can view the review queue.'}, status=403)
        tasks = Task.objects.filter(status='under_review').order_by('-updated_at')
        return Response(TaskSerializer(tasks, many=True, context={'request': request}).data)


class MyTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        tasks = Task.objects.filter(assigned_to=request.user)
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        return Response(TaskSerializer(tasks, many=True, context={'request': request}).data)
