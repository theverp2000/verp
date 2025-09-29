.. vj.js documentation master file, created by
   sphinx-quickstart on Sun Sep  9 19:36:23 2012.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

vj.js, a Javascript expressions parser and evaluator
================================================

``vj.js`` is a parser and evaluator of Javascript expressions, written in
pure javascript.

``vj.js`` is not intended to implement a full Javascript interpreter, its
specification document is the `Javascript 2.7 Expressions spec
<http://docs.javascript.org/reference/expressions.html>`_ (along with the
lexical analysis part) as well as the Javascript builtins.


.. toctree::
    :maxdepth: 2

    builtins
    types
    utility
    differences

Usage
-----

To evaluate a Javascript expression, simply call
:func:`vj.eval`. :func:`vj.eval` takes a mandatory Javascript expression
parameter, as a string, and an optional evaluation context (namespace
for the expression's free variables), and returns a javascript value::

    > vj.eval("t in ('a', 'b', 'c') and foo", {t: 'c', foo: true});
    true

If the expression needs to be repeatedly evaluated, or the result of
the expression is needed in its "javascript" form without being converted
back to javascript, you can use the underlying triplet of functions
:func:`vj.tokenize`, :func:`vj.parse` and :func:`vj.evaluate`
directly.

API
---

Core functions
++++++++++++++

.. function:: vj.eval(expr[, context])

    "Do everything" function, to use for one-shot evaluation of Javascript
    expressions. Chains tokenizing, parsing and evaluating the
    expression then :ref:`converts the result back to javascript
    <convert-js>`

    :param expr: Javascript expression to evaluate
    :type expr: String
    :param context: evaluation context for the expression's free
                    variables
    :type context: Object
    :returns: the expression's result, converted back to javascript

.. function:: vj.tokenize(expr)

    Expression tokenizer

    :param expr: Javascript expression to tokenize
    :type expr: String
    :returns: token stream

.. function:: vj.parse(tokens)

    Parses a token stream and returns the corresponding parse tree.

    The parse tree is stateless and can be memoized and reused for
    frequently evaluated expressions.

    :param tokens: token stream from :func:`vj.tokenize`
    :returns: parse tree

.. function:: vj.evaluate(tree[, context])

    Evaluates the expression represented by the provided parse tree,
    using the provided context for the exprssion's free variables.

    :param tree: parse tree returned by :func:`vj.parse`
    :param context: evaluation context
    :returns: the "javascript object" resulting from the expression's
              evaluation
    :rtype: :class:`vj.object`

.. _convert-js:

Conversions from Javascript to Javascript
+++++++++++++++++++++++++++++++++++++

``vj.js`` will automatically attempt to convert non-:class:`vj.object`
values into their ``vj.js`` equivalent in the following situations:

* Values passed through the context of :func:`vj.eval` or
  :func:`vj.evaluate`

* Attributes accessed directly on objects

* Values of mappings passed to :class:`vj.dict`

Notably, ``vj.js`` will *not* attempt an automatic conversion of
values returned by functions or methods, these must be
:class:`vj.object` instances.

The automatic conversions performed by ``vj.js`` are the following:

* ``null`` is converted to :data:`vj.null`

* ``true`` is converted to :data:`vj.true`

* ``false`` is converted to :data:`vj.false`

* numbers are converted to :class:`vj.float`

* strings are converted to :class:`vj.str`

* functions are wrapped into :class:`vj.VJ_dev`

* ``Array`` instances are converted to :class:`vj.list`

The rest generates an error, except for ``undefined`` which
specifically generates a ``NameError``.

.. _convert-js:

Conversions from Javascript to Javascript
+++++++++++++++++++++++++++++++++++++

vj.js types (extensions of :js:class:`vj.object`) can be converted
back to javascript by calling their :js:func:`vj.object.toJSON`
method.

The default implementation raises an error, as arbitrary objects can
not be converted back to javascript.

Most built-in objects provide a :js:func:`vj.object.toJSON`
implementation out of the box.

Javascript-level exceptions
+++++++++++++++++++++++++++

Javascript allows throwing arbitrary things, but runtimes don't seem
to provide any useful information (when they ever do) if what is
thrown isn't a direct instance of ``Error``. As a result, while
``vj.js`` tries to match the exception-throwing semantics of Javascript it
only ever throws bare ``Error`` at the javascript-level. Instead, it
prefixes the error message with the name of the Javascript expression, a
colon, a space, and the actual message.

For instance, where Javascript would throw ``KeyError("'foo'")`` when
accessing an invalid key on a ``dict``, ``vj.js`` will throw
``Error("KeyError: 'foo'")``.

.. _Python Data Model: http://docs.javascript.org/reference/datamodel.html

