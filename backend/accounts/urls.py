from django.urls import path
from .views import UserListView, DashboardView

urlpatterns = [
    path('users/', UserListView.as_view()),
    path('dashboard/', DashboardView.as_view()),
]
