from rest_framework.views import exception_handler
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Now handle Django ValidationError as DRF ValidationError
    if isinstance(exc, DjangoValidationError) and not response:
        if hasattr(exc, 'message_dict'):
            data = exc.message_dict
        else:
            data = {'error': exc.messages[0] if hasattr(exc, 'messages') and exc.messages else str(exc)}
        
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    return response