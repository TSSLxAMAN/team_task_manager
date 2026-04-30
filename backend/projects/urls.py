from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, ProjectMembersView

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view()),
    path('projects/<int:pk>/', ProjectDetailView.as_view()),
    path('projects/<int:pk>/members/', ProjectMembersView.as_view()),
    path('projects/<int:pk>/members/<int:user_id>/', ProjectMembersView.as_view()),
]
