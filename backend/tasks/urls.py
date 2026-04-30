from django.urls import path
from .views import (
    ProjectTaskListCreateView, TaskDetailView,
    TaskStartView, TaskSubmitView, TaskCloseView, TaskReopenView,
    ReviewQueueView, MyTasksView,
)

urlpatterns = [
    path('projects/<int:project_pk>/tasks/', ProjectTaskListCreateView.as_view()),
    path('tasks/<int:pk>/', TaskDetailView.as_view()),
    path('tasks/<int:pk>/start/', TaskStartView.as_view()),
    path('tasks/<int:pk>/submit/', TaskSubmitView.as_view()),
    path('tasks/<int:pk>/close/', TaskCloseView.as_view()),
    path('tasks/<int:pk>/reopen/', TaskReopenView.as_view()),
    path('tasks/review-queue/', ReviewQueueView.as_view()),
    path('tasks/my-tasks/', MyTasksView.as_view()),
]
