from django.urls import path
from . import views

urlpatterns = [
    path("callback", views.OauthCallback.as_view(), name="oauth_callback"),
]
