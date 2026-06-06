from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from .models import RareBook, BookCategory


@login_required
def book_list(request):
    category_id = request.GET.get('category', '')
    status = request.GET.get('status', '')
    search = request.GET.get('search', '')
    
    books = RareBook.objects.all()
    
    if category_id:
        books = books.filter(category_id=category_id)
    if status:
        books = books.filter(status=status)
    if search:
        books = books.filter(
            Q(title__icontains=search) |
            Q(author__icontains=search) |
            Q(call_number__icontains=search)
        )
    
    categories = BookCategory.objects.all()
    
    context = {
        'books': books,
        'categories': categories,
        'current_category': category_id,
        'current_status': status,
        'search_query': search,
        'page_title': '珍本书目',
    }
    return render(request, 'catalog/book_list.html', context)


@login_required
def book_detail(request, pk):
    book = get_object_or_404(RareBook, pk=pk)
    timeline = book.get_history_timeline()
    
    context = {
        'book': book,
        'timeline': timeline,
        'page_title': book.title,
    }
    return render(request, 'catalog/book_detail.html', context)
