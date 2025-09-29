.. default-domain: javascript

.. _builtins:

Supported Javascript builtins
=========================

.. function:: vj.type(object)

    Gets the class of a provided object, if possible.

    .. note:: currently doesn't work correctly when called on a class
              object, will return the class itself (also, classes
              don't currently have a type).

.. js:function:: vj.type(name, bases, dict)

    Not exactly a builtin as this form is solely javascript-level
    (currently). Used to create new ``vj.js`` types. See :doc:`types`
    for its usage.

.. data:: vj.null

.. data:: vj.true

.. data:: vj.false

.. data:: vj.NotImplemented

.. class:: vj.object

    Base class for all types, even implicitly (if no bases are
    provided to :js:func:`vj.type`)

.. class:: vj.bool([object])

.. class:: vj.float([object])

.. class:: vj.str([object])

.. class:: vj.unicode([object])

.. class:: vj.tuple()

.. class:: vj.list()

.. class:: vj.dict()

.. function:: vj.len(object)

.. function:: vj.isinstance(object, type)

.. function:: vj.issubclass(type, other_type)

.. class:: vj.classmethod
