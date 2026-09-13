import { HttpInterceptorFn } from '@angular/common/http';

// يضيف تلقائيًا Authorization: Bearer <token> لكل طلب يطلع من التطبيق
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('al_omran_token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
