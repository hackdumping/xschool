from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SchoolYear, Class, Student, Subject, Period, Grade, SchoolConfiguration
from .serializers import SchoolYearSerializer, ClassSerializer, StudentSerializer, SubjectSerializer, PeriodSerializer, GradeSerializer, SchoolConfigurationSerializer

class SchoolYearViewSet(viewsets.ModelViewSet):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        grades_data = request.data
        if not isinstance(grades_data, list):
            return Response({'error': 'Expected a list of grades'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        for item in grades_data:
            student_id = item.get('student')
            subject_id = item.get('subject')
            period_id = item.get('period')
            value = item.get('value')
            
            if student_id and subject_id and period_id:
                grade, created = Grade.objects.update_or_create(
                    student_id=student_id,
                    subject_id=subject_id,
                    period_id=period_id,
                    defaults={'value': value}
                )
                results.append(GradeSerializer(grade).data)
        
        return Response(results, status=status.HTTP_201_CREATED)

class SchoolConfigurationViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action == 'school_settings' and self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def school_settings(self, request):
        obj, created = SchoolConfiguration.objects.get_or_create(id=1)
        
        if request.method == 'PATCH':
            serializer = SchoolConfigurationSerializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SchoolConfigurationSerializer(obj)
        return Response(serializer.data)
