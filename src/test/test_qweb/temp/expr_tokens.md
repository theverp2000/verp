** Expr:   request.csrfToken() 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='request', start=(1, 0), end=(1, 7), line='request.csrfToken()'), TokenInfo(type=53 (OP), string='.', start=(1, 7), end=(1, 8), line='request.csrfToken()'), TokenInfo(type=1 (NAME), string='csrfToken', start=(1, 8), end=(1, 18), line='request.csrfToken()'), TokenInfo(type=255 (QWEB), string='()', start=(1, 18), end=(1, 20), line=''), TokenInfo(type=4 (NEWLINE), string='', start=(1, 20), end=(1, 21), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values['request'].csrfToken()

** Expr:   'input-group-sm' if form_small else '' 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'input-group-sm'", start=(1, 0), end=(1, 16), line="'input-group-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='if', start=(1, 17), end=(1, 19), line="'input-group-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='form_small', start=(1, 20), end=(1, 30), line="'input-group-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='else', start=(1, 31), end=(1, 35), line="'input-group-sm' if form_small else ''"), TokenInfo(type=3 (STRING), string="''", start=(1, 36), end=(1, 38), line="'input-group-sm' if form_small else ''"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 38), end=(1, 39), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'input-group-sm' if values.get('form_small') else ''

** Expr:   request.db 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='request', start=(1, 0), end=(1, 7), line='request.db'), TokenInfo(type=53 (OP), string='.', start=(1, 7), end=(1, 8), line='request.db'), TokenInfo(type=1 (NAME), string='db', start=(1, 8), end=(1, 10), line='request.db'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 10), end=(1, 11), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values['request'].db

** Expr:   'form-control-sm' if form_small else '' 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'form-control-sm'", start=(1, 0), end=(1, 17), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='if', start=(1, 18), end=(1, 20), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='form_small', start=(1, 21), end=(1, 31), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='else', start=(1, 32), end=(1, 36), line="'form-control-sm' if form_small else ''"), TokenInfo(type=3 (STRING), string="''", start=(1, 37), end=(1, 39), line="'form-control-sm' if form_small else ''"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 39), end=(1, 40), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'form-control-sm' if values.get('form_small') else ''

** Expr:   databases and len(databases) > 1 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='databases', start=(1, 0), end=(1, 9), line='databases and len(databases) > 1'), TokenInfo(type=1 (NAME), string='and', start=(1, 10), end=(1, 13), line='databases and len(databases) > 1'), TokenInfo(type=1 (NAME), string='len', start=(1, 14), end=(1, 17), line='databases and len(databases) > 1'), TokenInfo(type=255 (QWEB), string="(values.get('databases'))", start=(1, 17), end=(1, 28), line=''), TokenInfo(type=53 (OP), string='>', start=(1, 29), end=(1, 30), line='databases and len(databases) > 1'), TokenInfo(type=2 (NUMBER), string='1', start=(1, 31), end=(1, 32), line='databases and len(databases) > 1'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 32), end=(1, 33), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('databases') and len(values.get('databases')) > 1

** Expr:   login 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='login', start=(1, 0), end=(1, 5), line='login'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 5), end=(1, 6), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('login')

** Expr:   'form-control-sm' if form_small else '' 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'form-control-sm'", start=(1, 0), end=(1, 17), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='if', start=(1, 18), end=(1, 20), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='form_small', start=(1, 21), end=(1, 31), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='else', start=(1, 32), end=(1, 36), line="'form-control-sm' if form_small else ''"), TokenInfo(type=3 (STRING), string="''", start=(1, 37), end=(1, 39), line="'form-control-sm' if form_small else ''"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 39), end=(1, 40), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'form-control-sm' if values.get('form_small') else ''

** Expr:   'form-control-sm' if form_small else '' 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'form-control-sm'", start=(1, 0), end=(1, 17), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='if', start=(1, 18), end=(1, 20), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='form_small', start=(1, 21), end=(1, 31), line="'form-control-sm' if form_small else ''"), TokenInfo(type=1 (NAME), string='else', start=(1, 32), end=(1, 36), line="'form-control-sm' if form_small else ''"), TokenInfo(type=3 (STRING), string="''", start=(1, 37), end=(1, 39), line="'form-control-sm' if form_small else ''"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 39), end=(1, 40), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'form-control-sm' if values.get('form_small') else ''

** Expr:   'autofocus' if login else None 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'autofocus'", start=(1, 0), end=(1, 11), line="'autofocus' if login else None"), TokenInfo(type=1 (NAME), string='if', start=(1, 12), end=(1, 14), line="'autofocus' if login else None"), TokenInfo(type=1 (NAME), string='login', start=(1, 15), end=(1, 20), line="'autofocus' if login else None"), TokenInfo(type=1 (NAME), string='else', start=(1, 21), end=(1, 25), line="'autofocus' if login else None"), TokenInfo(type=1 (NAME), string='None', start=(1, 26), end=(1, 30), line="'autofocus' if login else None"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 30), end=(1, 31), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'autofocus' if values.get('login') else None

** Expr:   error 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='error', start=(1, 0), end=(1, 5), line='error'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 5), end=(1, 6), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('error')

** Expr:   error 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='error', start=(1, 0), end=(1, 5), line='error'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 5), end=(1, 6), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('error')

** Expr:   message 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='message', start=(1, 0), end=(1, 7), line='message'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 7), end=(1, 8), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('message')

** Expr:   message 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='message', start=(1, 0), end=(1, 7), line='message'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 7), end=(1, 8), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('message')

** Expr:   'pt-2' if form_small else 'pt-3' 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=3 (STRING), string="'pt-2'", start=(1, 0), end=(1, 6), line="'pt-2' if form_small else 'pt-3'"), TokenInfo(type=1 (NAME), string='if', start=(1, 7), end=(1, 9), line="'pt-2' if form_small else 'pt-3'"), TokenInfo(type=1 (NAME), string='form_small', start=(1, 10), end=(1, 20), line="'pt-2' if form_small else 'pt-3'"), TokenInfo(type=1 (NAME), string='else', start=(1, 21), end=(1, 25), line="'pt-2' if form_small else 'pt-3'"), TokenInfo(type=3 (STRING), string="'pt-3'", start=(1, 26), end=(1, 32), line="'pt-2' if form_small else 'pt-3'"), TokenInfo(type=4 (NEWLINE), string='', start=(1, 32), end=(1, 33), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> 'pt-2' if values.get('form_small') else 'pt-3'

** Expr:    keepQuery()  
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='keepQuery', start=(1, 0), end=(1, 10), line='keepQuery()'), TokenInfo(type=255 (QWEB), string='()', start=(1, 10), end=(1, 12), line=''), TokenInfo(type=4 (NEWLINE), string='', start=(1, 12), end=(1, 13), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('keepQuery')()

** Expr:   signup_enabled 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='signup_enabled', start=(1, 0), end=(1, 14), line='signup_enabled'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 14), end=(1, 15), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('signup_enabled')

** Expr:    keepQuery()  
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='keepQuery', start=(1, 0), end=(1, 10), line='keepQuery()'), TokenInfo(type=255 (QWEB), string='()', start=(1, 10), end=(1, 12), line=''), TokenInfo(type=4 (NEWLINE), string='', start=(1, 12), end=(1, 13), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('keepQuery')()

** Expr:   reset_password_enabled 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='reset_password_enabled', start=(1, 0), end=(1, 22), line='reset_password_enabled'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 22), end=(1, 23), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('reset_password_enabled')

** Expr:   debug 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='debug', start=(1, 0), end=(1, 5), line='debug'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 5), end=(1, 6), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('debug')

** Expr:   redirect 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='redirect', start=(1, 0), end=(1, 8), line='redirect'), TokenInfo(type=4 (NEWLINE), string='', start=(1, 8), end=(1, 9), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values.get('redirect')