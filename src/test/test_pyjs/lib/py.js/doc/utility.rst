Utility functions for interacting with ``vj.js`` objects
========================================================

Essentially the ``vj.js`` version of the Javascript C API, these functions
are used to implement new ``vj.js`` types or to interact with existing
ones.

They are prefixed with ``VJ_``.

.. function:: vj.VJ_parseArgs(arguments, format)

    Arguments parser converting from the :ref:`user-defined calling
    conventions <types-methods-javascript-call>` to a JS object mapping
    argument names to values. It serves the same role as
    `PyArg_ParseTupleAndKeywords`_.

    ::

        var args = vj.VJ_parseArgs(
            arguments, ['foo', 'bar', ['baz', 3], ['qux', "foo"]]);

    roughly corresponds to the argument spec:

    .. code-block:: javascript

        def func(foo, bar, baz=3, qux="foo"):
            pass

    .. note:: a significant difference is that "default values" will
              be re-evaluated at each call, since they are within the
              function.

    :param arguments: array-like objects holding the args and kwargs
                      passed to the callable, generally the
                      ``arguments`` of the caller.

    :param format: mapping declaration to the actual arguments of the
                   function. A javascript array composed of five
                   possible types of elements:

                   * The literal string ``'*'`` marks all following
                     parameters as keyword-only, regardless of them
                     having a default value or not [#kwonly]_. Can
                     only be present once in the parameters list.

                   * A string prefixed by ``*``, marks the positional
                     variadic parameter for the function: gathers all
                     provided positional arguments left and makes all
                     following parameters keyword-only
                     [#star-args]_. ``*args`` is incompatible with
                     ``*``.

                   * A string prefixed with ``**``, marks the
                     positional keyword variadic parameter for the
                     function: gathers all provided keyword arguments
                     left and closes the argslist. If present, this
                     must be the last parameter of the format list.

                   * A string defines a required parameter, accessible
                     positionally or through keyword

                   * A pair of ``[String, vj.object]`` defines an
                     optional parameter and its default value.

                   For simplicity, when not using optional parameters
                   it is possible to use a simple string as the format
                   (using space-separated elements). The string will
                   be split on whitespace and processed as a normal
                   format array.

    :returns: a javascript object mapping argument names to values

    :raises: ``TypeError`` if the provided arguments don't match the
             format

.. class:: vj.VJ_def(fn)

    Type wrapping javascript functions into vj.js callables. The
    wrapped function follows :ref:`the vj.js calling conventions
    <types-methods-javascript-call>`

    :param Function fn: the javascript function to wrap
    :returns: a callable vj.js object

Object Protocol
---------------

.. function:: vj.VJ_hasAttr(o, attr_name)

    Returns ``true`` if ``o`` has the attribute ``attr_name``,
    otherwise returns ``false``. Equivalent to Javascript's ``hasattr(o,
    attr_name)``

    :param o: A :class:`vj.object`
    :param attr_name: a javascript ``String``
    :rtype: ``Boolean``

.. function:: vj.VJ_getAttr(o, attr_name)

    Retrieve an attribute ``attr_name`` from the object ``o``. Returns
    the attribute value on success, raises ``AttributeError`` on
    failure. Equivalent to the javascript expression ``o.attr_name``.

    :param o: A :class:`vj.object`
    :param attr_name: a javascript ``String``
    :returns: A :class:`vj.object`
    :raises: ``AttributeError``

.. function:: vj.VJ_str(o)

    Computes a string representation of ``o``, returns the string
    representation. Equivalent to ``str(o)``

    :param o: A :class:`vj.object`
    :returns: :class:`vj.str`

.. function:: vj.VJ_isInstance(inst, cls)

    Returns ``true`` if ``inst`` is an instance of ``cls``, ``false``
    otherwise.

.. function:: vj.VJ_isSubclass(derived, cls)

    Returns ``true`` if ``derived`` is ``cls`` or a subclass thereof.

.. function:: vj.VJ_call(callable[, args][, kwargs])

    Call an arbitrary javascript-level callable from javascript.

    :param callable: A ``vj.js`` callable object (broadly speaking,
                     either a class or an object with a ``__call__``
                     method)

    :param args: javascript Array of :class:`vj.object`, used as
                 positional arguments to ``callable``

    :param kwargs: javascript Object mapping names to
                   :class:`vj.object`, used as named arguments to
                   ``callable``

    :returns: nothing or :class:`vj.object`

.. function:: vj.VJ_isTrue(o)

    Returns ``true`` if the object is considered truthy, ``false``
    otherwise. Equivalent to ``bool(o)``.

    :param o: A :class:`vj.object`
    :rtype: Boolean

.. function:: vj.VJ_not(o)

    Inverse of :func:`vj.VJ_isTrue`.

.. function:: vj.VJ_size(o)

    If ``o`` is a sequence or mapping, returns its length. Otherwise,
    raises ``TypeError``.

    :param o: A :class:`vj.object`
    :returns: ``Number``
    :raises: ``TypeError`` if the object doesn't have a length

.. function:: vj.VJ_getItem(o, key)

    Returns the element of ``o`` corresponding to the object
    ``key``. This is equivalent to ``o[key]``.

    :param o: :class:`vj.object`
    :param key: :class:`vj.object`
    :returns: :class:`vj.object`
    :raises: ``TypeError`` if ``o`` does not support the operation, if
             ``key`` or the return value is not a :class:`vj.object`

.. function:: vj.VJ_setItem(o, key, v)

    Maps the object ``key`` to the value ``v`` in ``o``. Equivalent to
    ``o[key] = v``.

    :param o: :class:`vj.object`
    :param key: :class:`vj.object`
    :param v: :class:`vj.object`
    :raises: ``TypeError`` if ``o`` does not support the operation, or
             if ``key`` or ``v`` are not :class:`vj.object`

Number Protocol
---------------

.. function:: vj.VJ_add(o1, o2)

    Returns the result of adding ``o1`` and ``o2``, equivalent to
    ``o1 + o2``.

    :param o1: :class:`vj.object`
    :param o2: :class:`vj.object`
    :returns: :class:`vj.object`

.. function:: vj.VJ_subtract(o1, o2)

    Returns the result of subtracting ``o2`` from ``o1``, equivalent
    to ``o1 - o2``.

    :param o1: :class:`vj.object`
    :param o2: :class:`vj.object`
    :returns: :class:`vj.object`

.. function:: vj.VJ_multiply(o1, o2)

    Returns the result of multiplying ``o1`` by ``o2``, equivalent to
    ``o1 * o2``.

    :param o1: :class:`vj.object`
    :param o2: :class:`vj.object`
    :returns: :class:`vj.object`

.. function:: vj.VJ_divide(o1, o2)

    Returns the result of dividing ``o1`` by ``o2``, equivalent to
    ``o1 / o2``.

    :param o1: :class:`vj.object`
    :param o2: :class:`vj.object`
    :returns: :class:`vj.object`

.. function:: vj.VJ_negative(o)

    Returns the negation of ``o``, equivalent to ``-o``.

    :param o: :class:`vj.object`
    :returns: :class:`vj.object`

.. function:: vj.VJ_positive(o)

    Returns the "positive" of ``o``, equivalent to ``+o``.

    :param o: :class:`vj.object`
    :returns: :class:`vj.object`

.. [#kwonly] Javascript 2, which vj.js currently implements, does not
             support Javascript-level keyword-only parameters (it can be
             done through the C-API), but it seemed neat and easy
             enough so there.

.. [#star-args] due to this and contrary to Javascript 2, vj.js allows
                arguments other than ``**kwargs`` to follow ``*args``.

.. _PyArg_ParseTupleAndKeywords:
    http://docs.javascript.org/c-api/arg.html#PyArg_ParseTupleAndKeywords
