from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/', include('accounts.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('tasks.urls')),
]
