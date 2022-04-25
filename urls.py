from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('demo', TemplateView.as_view(template_name='editor/page.html'), name='editor'),
]

app_name = 'editor'
