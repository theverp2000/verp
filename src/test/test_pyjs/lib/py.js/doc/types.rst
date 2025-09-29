Implementing a custom type
==========================

To implement a custom javascript-level type, one can use the
:func:`vj.type` builtin. At the JS-level, it is a function with the
same signature as the :js:class:`type` builtin [#bases]_. It returns a
child type of its one base (or :js:class:`vj.object` if no base is
provided).

The ``dict`` parameter to :func:`vj.type` can contain any
attribute, javascript-level or javascript-level: the default
``__getattribute__`` implementation will ensure they are converted to
Javascript-level attributes if needed. Most methods are also wrapped and
converted to :ref:`types-methods-javascript`, although there are a number
of special cases:

* Most "magic methods" of the data model ("dunder" methods) remain
  javascript-level. See :ref:`the listing of magic methods and their
  signatures <types-methods-dunder>`. As a result, they do not respect
  the :ref:`types-methods-javascript-call`

* The ``toJSON`` and ``fromJSON`` methods are special-cased to remain
  javascript-level and don't follow the
  :ref:`types-methods-javascript-call`

* Functions which have been wrapped explicitly (via
  :class:`vj.VJ_def`, :js:class:`vj.classmethod` or
  :js:class:`vj.staticmethod`) are associated to the class
  untouched. But due to their wrapper, they will use the
  :ref:`types-methods-javascript-call` anyway

.. _types-methods-javascript:

Javascript-level callable
---------------------

Wrapped javascript function *or* the :func:`__call__` method itself
follow the :ref:`types-methods-javascript-call`. As a result, they can't
(easily) be called directly from javascript code. Because
:func:`__new__` and :func:`__init__` follow from :func:`__call__`,
they also follow the :ref:`types-methods-javascript-call`.

:func:`vj.VJ_call` should be used when interacting with them from
javascript is necessary.

Because ``__call__`` follows the :ref:`types-methods-javascript-call`,
instantiating a ``vj.js`` type from javascript requires using
:func:`vj.VJ_call`.

.. _types-methods-javascript-call:

Javascript calling conventions
++++++++++++++++++++++++++

The javascript-level arguments should be considered completely opaque,
they should be interacted with through :func:`vj.VJ_parseArgs` (to
extract javascript-level arguments to javascript implementation code) and
:func:`vj.VJ_call` (to call :ref:`types-methods-javascript` from
javascript code).

A callable following the :ref:`types-methods-javascript-call` *must*
return a ``vj.js`` object, an error will be generated when failing to
do so.

.. todo:: arguments forwarding when e.g. overriding methods?

.. _types-methods-dunder:

Magic methods
-------------

``vj.js`` doesn't support calling magic ("dunder") methods of the
datamodel from Javascript code, and these methods remain javascript-level
(they don't follow the :ref:`types-methods-javascript-call`).

Here is a list of the understood datamodel methods, refer to `the
relevant Javascript documentation
<http://docs.javascript.org/reference/datamodel.html?highlight=data%20model#special-method-names>`_
for their roles.

Basic customization
+++++++++++++++++++

.. function:: __hash__()

    :returns: String

.. function:: __eq__(other)

    The default implementation tests for identity

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`

.. function:: __ne__(other)

    The default implementation calls :func:`__eq__` and reverses
    its result.

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`

.. function:: __lt__(other)

    The default implementation simply returns
    :data:`vj.NotImplemented`.

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`


.. function:: __le__(other)

    The default implementation simply returns
    :data:`vj.NotImplemented`.

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`


.. function:: __ge__(other)

    The default implementation simply returns
    :data:`vj.NotImplemented`.

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`


.. function:: __gt__(other)

    The default implementation simply returns
    :data:`vj.NotImplemented`.

    :param other: :js:class:`vj.object` to compare this object with
    :returns: :js:class:`vj.bool`

.. function:: __str__()

    Simply calls :func:`__unicode__`. This method should not be
    overridden, :func:`__unicode__` should be overridden instead.

    :returns: :js:class:`vj.str`

.. function:: __unicode__()

    :returns: :js:class:`vj.unicode`

.. function:: __nonzero__()

    The default implementation always returns :data:`vj.true`

    :returns: :js:class:`vj.bool`

Customizing attribute access
++++++++++++++++++++++++++++

.. function:: __getattribute__(name)

    :param String name: name of the attribute, as a javascript string
    :returns: :js:class:`vj.object`

.. function:: __getattr__(name)

    :param String name: name of the attribute, as a javascript string
    :returns: :js:class:`vj.object`

.. function:: __setattr__(name, value)

    :param String name: name of the attribute, as a javascript string
    :param value: :js:class:`vj.object`

Implementing descriptors
++++++++++++++++++++++++

.. function:: __get__(instance)

    .. note:: readable descriptors don't currently handle "owner
              classes"

    :param instance: :js:class:`vj.object`
    :returns: :js:class:`vj.object`

.. function:: __set__(instance, value)

    :param instance: :js:class:`vj.object`
    :param value: :js:class:`vj.object`

Emulating Numeric Types
+++++++++++++++++++++++

* Non-in-place binary numeric methods (e.g. ``__add__``, ``__mul__``,
  ...) should all be supported including reversed calls (in case the
  primary call is not available or returns
  :js:data:`vj.NotImplemented`). They take a single
  :js:class:`vj.object` parameter and return a single
  :js:class:`vj.object` parameter.

* Unary operator numeric methods are all supported:

  .. function:: __pos__()

      :returns: :js:class:`vj.object`

  .. function:: __neg__()

      :returns: :js:class:`vj.object`

  .. function:: __invert__()

      :returns: :js:class:`vj.object`

* For non-operator numeric methods, support is contingent on the
  corresponding :ref:`builtins <builtins>` being implemented

Emulating container types
+++++++++++++++++++++++++

.. function:: __len__()

    :returns: :js:class:`vj.int`

.. function:: __getitem__(name)

    :param name: :js:class:`vj.object`
    :returns: :js:class:`vj.object`

.. function:: __setitem__(name, value)

    :param name: :js:class:`vj.object`
    :param value: :js:class:`vj.object`

.. function:: __iter__()

    :returns: :js:class:`vj.object`

.. function:: __reversed__()

    :returns: :js:class:`vj.object`

.. function:: __contains__(other)

    :param other: :js:class:`vj.object`
    :returns: :js:class:`vj.bool`

.. [#bases] with the limitation that, because :ref:`vj.js builds its
            object model on top of javascript's
            <details-object-model>`, only one base is allowed.
