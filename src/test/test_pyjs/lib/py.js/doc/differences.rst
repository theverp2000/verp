Differences with Javascript
=======================

* ``vj.js`` completely ignores old-style classes as well as their
  lookup details. All ``vj.js`` types should be considered matching
  the behavior of new-style classes

* New types can only have a single base. This is due to ``vj.js``
  implementing its types on top of Javascript's, and javascript being
  a single-inheritance language.

  This may change if ``vj.js`` ever reimplements its object model from
  scratch.

* Piggybacking on javascript's object model also means metaclasses are
  not available (:js:func:`vj.type` is a function)

* A javascript-level function (created through :js:class:`vj.VJ_def`) set
  on a new type will not become a method, it'll remain a function.

* :js:func:`vj.VJ_parseArgs` supports keyword-only arguments (though
  it's a Javascript 3 feature)

* Because the underlying type is a javascript ``String``, there
  currently is no difference between :js:class:`vj.str` and
  :js:class:`vj.unicode`. As a result, there also is no difference
  between :js:func:`__str__` and :js:func:`__unicode__`.

Unsupported features
--------------------

These are Javascript features which are not supported at all in ``vj.js``,
usually because they don't make sense or there is no way to support them

* The ``__delattr__``, ``__delete__`` and ``__delitem__``: as
  ``vj.js`` only handles expressions and these are accessed via the
  ``del`` statement, there would be no way to call them.

* ``__del__`` the lack of cross-platform GC hook means there is no way
  to know when an object is deallocated.

* ``__slots__`` are not handled

* Dedicated (and deprecated) slicing special methods are unsupported

Missing features
----------------

These are Javascript features which are missing because they haven't been
implemented yet:

* Class-binding of descriptors doesn't currently work.

* Instance and subclass checks can't be customized

* "poor" comparison methods (``__cmp__`` and ``__rcmp__``) are not
  supported and won't be falled-back to.

* ``__coerce__`` is currently supported

* Context managers are not currently supported

* Unbound methods are not supported, instance methods can only be
  accessed from instances.
