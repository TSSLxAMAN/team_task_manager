from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.models import User
from accounts.serializers import UserSerializer
from .models import Project
from .serializers import ProjectSerializer, ProjectCreateSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Project.objects.all()
        return user.projects.all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only admins can create projects.')
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Project.objects.all()
        return user.projects.all()

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can update projects.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can delete projects.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get_project(self, pk, user):
        try:
            if user.role == 'admin':
                return Project.objects.get(pk=pk)
            return user.projects.get(pk=pk)
        except Project.DoesNotExist:
            return None

    def get(self, request, pk):
        project = self.get_project(pk, request.user)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(UserSerializer(project.members.all(), many=True).data)

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can add members.'}, status=403)
        project = self.get_project(pk, request.user)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'No user with that email.'}, status=404)
        project.members.add(user)
        return Response(UserSerializer(project.members.all(), many=True).data)

    def delete(self, request, pk, user_id):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can remove members.'}, status=403)
        project = self.get_project(pk, request.user)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        if user == project.created_by:
            return Response({'detail': 'Cannot remove project creator.'}, status=400)
        project.members.remove(user)
        return Response(UserSerializer(project.members.all(), many=True).data)
