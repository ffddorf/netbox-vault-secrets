from django.shortcuts import render
from django.views.generic import View


class OauthCallback(View):
    def get(self, request):
        resp = render(request, "netbox_vault_secrets/oauth_callback.html", {})
        resp["Cross-Origin-Opener-Policy"] = "unsafe-none"
        return resp
