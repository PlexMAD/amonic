from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .views import UserProfileView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path
from .views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'offices', OfficeViewSet)
router.register(r'user_sessions', UserSessionTrackingViewSet, basename='user_sessions')
router.register(r'airports', AirportsViewSet, basename='airports')
router.register(r'routes', RoutesViewSet, basename='routes')
router.register(r'schedules', SchedulesViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
    path('user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('current_user/', current_user, name='current_user'),
    path('add_user/', add_user, name='add_user'),
    path('update_user/<int:user_id>/', update_user, name='update_user'),
    path('logout/', logout_view, name='logout'),
    path('test_error/', test_error, name='test_error')
]
