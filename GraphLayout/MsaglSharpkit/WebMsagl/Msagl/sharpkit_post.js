﻿/*
This file contains some additions and changes to the SharpKit library and to the SharpKit-generated code. Some of these are additions to the
SharpKit implementation of the CLR types, which may involve changing the prototypes of core JS types to make them emulate the corresponding
.NET core types. Others are SharpKit bug fixes.

In order to be able to notice immediately whether one of these issues gets fixed by a SharpKit update, I'm going to also add some simple
tests which will throw an exception if something I expect not to be defined happens to be defined. This is not going to catch everything, so
I'll need to be careful. Notably, if one of my patches replaces an existing method from jsclr.js, there's no automated way to know that the
original method has been fixed.

This file was last checked against jsclr.js generated by SharpKit v5.4.1.
*/

/*********************
* BASE TYPES CHANGES *
*********************/

// Implementation of Boolean.CompareTo.
if (typeof Boolean.prototype.CompareTo$$Boolean !== "undefined")
    throw new Error();
Boolean.prototype.CompareTo$$Boolean = function (other) {
    if (this == false && other == true)
        return -1;
    if (this == true && other == false)
        return 1;
    return 0;
}

// This gets invoked on calls to IComparable.CompareTo, when the comparable happens to be a number.
if (typeof Number.prototype.CompareTo !== "undefined")
    throw new Error();
Number.prototype.CompareTo = function (other) {
    if (this > other)
        return 1;
    else if (this < other)
        return -1;
    return 0;
}

if (typeof Number.prototype.CompareTo$$UInt32 !== "undefined")
    throw new Error();
Number.prototype.CompareTo$$UInt32 = Number.prototype.CompareTo;

if (typeof Number.prototype.CompareTo$$UInt64 !== "undefined")
    throw new Error();
Number.prototype.CompareTo$$UInt64 = Number.prototype.CompareTo;

// Implementation of Int32.GetHashCode (should also work on other numbers).
if (typeof Number.prototype.GetHashCode !== "undefined")
    throw new Error();
Number.prototype.GetHashCode = function () {
    return this;
}

// This prevents crashes when attempting to format a number using globalization. It will NOT actually format it correctly.
if (typeof Number.prototype.ToString$$String$$IFormatProvider !== "undefined")
    throw new Error();
Number.prototype.ToString$$String$$IFormatProvider = function (s, fp) {
    return this.toString();
}

// This prevents crashes when attempting to invoke the version of String.Format that takes a format provider. Does not actually use the format provider.
if (typeof String.prototype.Format$$IFormatProvider$$String$$Object$Array !== "undefined")
    throw new Error();
String.prototype.Format$$IFormatProvider$$String$$Object$Array = function (fp, s, ar) {
    return System.String.Format$$String$$Object$Array(s, ar);
}


/********************
* CLR TYPES CHANGES *
********************/

// Locates the JsType object for a given name. This is needed because some of the type declarations are anonymous.
findJsType = function (name, idx) {
    if (isNaN(idx))
        idx = 0;
    for (var i = 0; i < JsTypes.length ; i++) {
        if (JsTypes[i].fullname == name && idx-- == 0)
            return JsTypes[i];
    }
}

// Implementation of Object.Equals (when called from subclasses).
var sktype_System$Object = findJsType("System.Object");
if (typeof sktype_System$Object.definition.Equals$$Object !== "undefined")
    throw new Error();
sktype_System$Object.definition.Equals$$Object = function (other) {
    return this === other;
}

if (typeof sktype_System$Object.definition.MemberwiseClone !== "undefined")
    throw new Error();
sktype_System$Object.definition.MemberwiseClone = function () {
    var t = this.GetType();
    var ret = System.Activator.CreateInstance$$Type(t);
    for (var $i15 = 0, $t15 = t.GetProperties(), $l15 = $t15.length, pi = $t15[$i15]; $i15 < $l15; $i15++, pi = $t15[$i15]) {
        if (pi.get_CanRead() && pi.get_CanWrite())
            pi.SetValue$$Object$$Object$$Object$Array(ret, pi.GetValue$$Object$$Object$Array(this, null), null);
    }
    return ret;
}

// Implement System.Double.IsInfinity
var sktype_System$Double = findJsType("System.Double");
if (typeof sktype_System$Double.staticDefinition.IsInfinity !== "undefined")
    throw new Error();
sktype_System$Double.staticDefinition.IsInfinity = function (d) {
    return !isFinite(d);
}

// Implement explicit array setter (for when the array is considered as a IList<T>).
var sktype_Array = findJsType("Array");
if (typeof sktype_System$Double.definition.set_Item$$Int32 !== "undefined")
    throw new Error();
sktype_Array.definition.set_Item$$Int32 = function (index, value) {
    this[index] = value;
}

// Prevents crashes when attempting to call the upper-case version of copyTo.
if (typeof sktype_Array.definition.CopyTo !== "undefined")
    throw new Erro();
sktype_Array.definition.CopyTo = sktype_Array.definition.copyTo;

// Prevents crashes when attempting to call the upper-case version of copyTo.
var sktype_Int32Array = findJsType("Int32Array", 1);
if (typeof sktype_Int32Array.CopyTo !== "undefined")
    throw new Error();
sktype_Int32Array.definition.CopyTo = function (dest, idx) {
    for (var i = 0; i < this.length; i++)
        dest[i + idx] = this[i];
}

// Prevents crashes when attempting to use a seeded constructor. Does not actually use the seed.
// Note: this method is implemented in jsclr.js, but it throws.
System$Random.definition.ctor$$Int32 = System$Random.definition.ctor

// This prevents crashes when attempting to use the Dictionary constructor that takes a size. It doesn't actually do anything with that size.
if (typeof System$Collections$Generic$Dictionary$2.definition.ctor$$Int32 !== "undefined")
    throw new Error();
System$Collections$Generic$Dictionary$2.definition.ctor$$Int32 = System$Collections$Generic$Dictionary$2.definition.ctor;

// Implementation of Dictionary.Count.
// Note: this method is implemented in jsclr.js, but it throws.
System$Collections$Generic$Dictionary$2.definition.get_Count = function () {
    return this.get_Keys().get_Count();
}

// This changes the jsclr version of the method in order to better emulate the .NET behaviour.
// Note: this method is implemented in jsclr, but it throws if the key is not present. The .NET version just returns false.
System$Collections$Generic$Dictionary$2.definition.Remove = function (key) {
    if (key == null)
        throw $CreateException(new System.ArgumentNullException.ctor$$String("key"), new Error());
    if (!this.ContainsKey(key))
        return false;
    var hashKey = this.GetHashKey(key);
    delete this._table[hashKey];
    delete this._keys[hashKey];
    this._version++;
    return true;
}

// This changes the jsclr version of the method so that the value is not changed if it is not in the table.
System$Collections$Generic$Dictionary$2.definition.TryGetValue = function (key, value) {
    var hashKey = this.GetHashKey(key);
    var v = this._table[hashKey];
    if (v !== undefined)
        value.Value = v;
    return typeof (v) != "undefined";
}

// Prevents crashes when attempting to call the constructor with size. Does not actually use the size.
if (typeof System$Collections$Generic$List$1.definition.ctor$$Int32 !== "undefined")
    throw new Error();
System$Collections$Generic$List$1.definition.ctor$$Int32 = System$Collections$Generic$List$1.definition.ctor;

// Prevents crashes when attempting to reason on the list capacity. Returns the list size.
if (typeof System$Collections$Generic$List$1.definition.get_Capacity !== "undefined")
    throw new Error();
System$Collections$Generic$List$1.definition.get_Capacity = function () { return this.get_Count(); }

// Prevents crashes when attempting to affect the list capacity. Does not actually do anything.
if (typeof System$Collections$Generic$List$1.definition.set_Capacity !== "undefined")
    throw new Error();
System$Collections$Generic$List$1.definition.set_Capacity = function (c) { }

// Implementation of List.CopyTo
System$Collections$Generic$List$1.definition.CopyTo = function (array, arrayIndex) {
    for (var i = 0; i < this._list.length; i++)
        array[i + arrayIndex] = this._list[i];
}
System$Collections$Generic$List$1.definition.CopyTo$$T$Array$$Int32 = System$Collections$Generic$List$1.definition.CopyTo;

// Implementation of Array.Copy. Warning: 1d arrays only.
if (typeof System$Array.staticDefinition.Copy !== "undefined")
    throw new Error();
System$Array.staticDefinition.Copy = function (source, sstart, dest, dstart, len) {
    for (var i = 0; i < len; i++)
        dest[dstart + i] = source[sstart + i];
}

// Replaces the jsclr version.
// Note: this method is present in jsclr.js, but it has a weird bug that causes it to return the iterator itself, which in turn
// causes certain actions on the enumerator to invalidate it.
System$Linq$Enumerable$TakeIterator.definition.GetEnumerator = function () {
    return new System.Linq.Enumerable.TakeIterator.ctor(this.T, this.First, this.Second);
}

// Same as above.
System$Linq$Enumerable$Iterator.definition.GetEnumerator = function () {
    var iterator = this.Clone();
    iterator.state = 1;
    return iterator;
}

// Prevents the iterator from crashing when the inner enumerator is not disposable.
System$Linq$Enumerable$WhereSelectEnumerableIterator.definition.Dispose = function () {
    if (this.enumerator != null && this.enumerator.Dispose !== undefined) {
        this.enumerator.Dispose();
    }
    this.enumerator = null;
    System.Linq.Enumerable.Iterator.commonPrototype.Dispose.call(this);
}

// Prevents crashes when attempting to call Cast.
if (typeof System$Linq$Enumerable.staticDefinition.Cast$1 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Cast$1 = function (t, s) {
    return s;
}

// Implementation of Distinct
if (typeof System$Linq$Enumerable.staticDefinition.Distinct$1$$IEnumerable$1 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Distinct$1$$IEnumerable$1 = function (t, s) {
    var en = s.GetEnumerator();
    var map = {};
    while (en.MoveNext()) {
        var c = en.get_Current();
        var k = JsCompiler.GetHashKey(c);
        map[k] = c;
    }
    var ret = [];
    for (var k in map)
        ret.push(map[k]);
    return ret;
}

// Implementation of Max(Func).
if (typeof System$Linq$Enumerable.staticDefinition.Max$1$$IEnumerable$1$$Func$2 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Max$1$$IEnumerable$1$$Func$2 = function (TSource, source, keySelector) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = keySelector(en.get_Current());
    while (en.MoveNext()) {
        var candidate = keySelector(en.get_Current());
        if (candidate.CompareTo(ret) > 0)
            ret = candidate;
    }
    return ret;
}

// Implementation of Min(Func)
if (typeof System$Linq$Enumerable.staticDefinition.Min$1$$IEnumerable$1$$Func$2 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Min$1$$IEnumerable$1$$Func$2 = function (TSource, source, keySelector) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = keySelector(en.get_Current());
    while (en.MoveNext()) {
        var candidate = keySelector(en.get_Current());
        if (candidate.CompareTo(ret) < 0)
            ret = candidate;
    }
    return ret;
}

// Implementation of Max<double>().
if (typeof System$Linq$Enumerable.staticDefinition.Max$$IEnumerable$1$Double !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Max$$IEnumerable$1$Double = function (source) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = en.get_Current();
    while (en.MoveNext()) {
        var candidate = en.get_Current();
        if (candidate > ret)
            ret = candidate;
    }
    return ret;
}

// Implementation of Max<Int32>().
if (typeof System$Linq$Enumerable.staticDefinition.Max$$IEnumerable$1$Int32 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Max$$IEnumerable$1$Int32 = function (source) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = en.get_Current();
    while (en.MoveNext()) {
        var candidate = en.get_Current();
        if (candidate > ret)
            ret = candidate;
    }
    return ret;
}

// Implementation of Min<Int32>().
if (typeof System$Linq$Enumerable.staticDefinition.Min$$IEnumerable$1$Int32 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Min$$IEnumerable$1$Int32 = function (source) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = en.get_Current();
    while (en.MoveNext()) {
        var candidate = en.get_Current();
        if (candidate < ret)
            ret = candidate;
    }
    return ret;
}

// Implementation of Sum<Double>().
if (typeof System$Linq$Enumerable.staticDefinition.Sum$$IEnumerable$1$Double !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Sum$$IEnumerable$1$Double = function (source) {
    var en = source.GetEnumerator();
    if (!en.MoveNext())
        throw $CreateException(new System.InvalidOperationException.ctor$$String("The sequence contains no elements"), new Error());
    var ret = en.get_Current();
    while (en.MoveNext())
        ret += en.get_Current();
    return ret;
}

// Implementation of All()
if (typeof System$Linq$Enumerable.staticDefinition.All$1 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.All$1 = function (TSource, source, predicate) {
    var en = source.GetEnumerator();
    while (en.MoveNext())
        if (!predicate(en.get_Current()))
            return false;
    return true;
}

if (typeof System$Linq$Enumerable.staticDefinition.ElementAt$1 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.ElementAt$1 = function (TSource, source, idx) {
    if (idx < 0)
        throw $CreateException(new System.InvalidOperationException.ctor$$String("Negative index"), new Error());
    var en = source.GetEnumerator();
    while (en.MoveNext())
        if (idx-- == 0)
            return en.get_Current();
    throw $CreateException(new System.InvalidOperationException.ctor$$String("Index out of bounds"), new Error());
}

// Implementation of GroupBy
if (typeof System$Linq$Enumerable.staticDefinition.GroupBy$2$$IEnumerable$1$$Func$2 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.GroupBy$2$$IEnumerable$1$$Func$2 = function (TKey, TSource, source, keySelector) {
    var dic = new System.Collections.Generic.Dictionary$2.ctor(TKey, System.Linq.Grouping$2.ctor);
    var $it15 = source.GetEnumerator();
    while ($it15.MoveNext()) {
        var s = $it15.get_Current();
        var key = keySelector(s);
        if (!dic.ContainsKey(key))
            dic.set_Item$$TKey(key, (function () {
                var $v3 = new System.Linq.Grouping$2.ctor(TKey, TSource);
                $v3.set_Key(key);
                return $v3;
            })());
        dic.get_Item$$TKey(key).Add(s);
    }
    return System.Linq.Enumerable.ToList$1(System.Linq.Grouping$2.ctor, dic.get_Values());
}

// Implementation of Aggregate
if (typeof System$Linq$Enumerable.staticDefinition.Aggregate$2$$IEnumerable$1$$TAccumulate$$Func$3 !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Aggregate$2$$IEnumerable$1$$TAccumulate$$Func$3 = function (TSource, TAccumulate, source, seed, func) {
    var ret = seed;
    var $it14 = source.GetEnumerator();
    while ($it14.MoveNext()) {
        var s = $it14.get_Current();
        ret = func(ret, s);
    }
    return ret;
}

// Implementation of List.Sort(IComparer)
if (typeof System$Collections$Generic$List$1.definition.Sort$$IComparer$1 !== "undefined")
    throw new Error();
System$Collections$Generic$List$1.definition.Sort$$IComparer$1 = function (comparer) {
    System.Array.Sort$$Array$$IComparer(this._list, comparer);
}

// Implementation of Array.Sort<T1,T2>(T1[], T2[]); note this is a quick'n'dirty fix and is inefficient.
if (typeof System$Array.staticDefinition.Sort$2$$TKey$Array$$TValue$Array !== "undefined")
    throw new Error();
System$Array.staticDefinition.Sort$2$$TKey$Array$$TValue$Array = function (TKey, TValue, keys, values) {
    var tupleArray = [];
    for (var i = 0; i < keys.length; i++)
        tupleArray[i] = { key: keys[i], value: values[i] };
    tupleArray.sort(function (t1, t2) { return t1.key - t2.key });
    for (var i = 0; i < keys.length; i++)
        values[i] = tupleArray[i].value;
}

// Implementation of PropertyInfo.CanRead
if (typeof System$Reflection$PropertyInfo.definition.get_CanRead !== "undefined")
    throw new Error();
System$Reflection$PropertyInfo.definition.get_CanRead = function () {
    return this._Getter != null;
}

// Implementation of PropertyInfo.CanWrite
if (typeof System$Reflection$PropertyInfo.definition.get_CanWrite !== "undefined")
    throw new Error();
System$Reflection$PropertyInfo.definition.get_CanWrite = function () {
    return this._Setter != null;
}

// Implementation of Tuple.GetHashCode
if (typeof System$Tuple$2.definition.GetHashCode !== "undefined")
    throw new Error();
System$Tuple$2.definition._hashKey = null;
System$Tuple$2.definition.ctor = function (T1, T2, item1, item2) {
    this.T1 = T1;
    this.T2 = T2;
    this._item1 = null;
    this._item2 = null;
    System.Object.ctor.call(this);
    this._item1 = item1;
    this._item2 = item2;
    this._hashKey = SharpKit.JavaScript.Utils.Js.GetHashKey(item1) + "," + SharpKit.JavaScript.Utils.Js.GetHashKey(item2);
};

// Implementation of the IEnumerable constructor for HashSet
if (typeof System$Collections$Generic$HashSet$1.definition.ctor$$IEnumerable$1 !== "undefined")
    throw new Error();
System$Collections$Generic$HashSet$1.definition.ctor$$IEnumerable$1 = function (T, source) {
    this.T = T;
    this.Hashtable = new Object();
    this.Comparer = null;
    this._Count = 0;
    System.Object.ctor.call(this);

    var en = source.GetEnumerator();
    while (en.MoveNext()) {
        var item = en.get_Current();
        var key = this.GetHashKey(item);
        if (this.Hashtable[key] != null)
            return false;
        this.Hashtable[key] = item;
        this._Count++;
    }
}

if (typeof System$Linq$Enumerable.staticDefinition.Range !== "undefined")
    throw new Error();
System$Linq$Enumerable.staticDefinition.Range = function (start, count) {
    var ret = new Array(count);
    for (var i = 0; i < ret.length; i++)
        ret[i] = i + start;
    return ret;
}

/***********************
* ADDITIONAL CLR TYPES *
***********************/

// Implementation of IGrouping
var System$Linq$Grouping$2 = {
    fullname: "System.Linq.Grouping$2",
    baseTypeName: "System.Collections.Generic.List$1",
    assemblyName: "Microsoft.Msagl",
    interfaceNames: ["System.Linq.IGrouping$2"],
    Kind: "Class",
    definition: {
        ctor: function (TKey, TSource) {
            this.TKey = TKey;
            this.TSource = TSource;
            this._Key = null;
            System.Collections.Generic.List$1.ctor.call(this, this.TSource);
        },
        Key$$: "`0",
        get_Key: function () {
            return this._Key;
        },
        set_Key: function (value) {
            this._Key = value;
        }
    }
};
JsTypes.push(System$Linq$Grouping$2);

// Prevents crashes when attempting to reference the invariant culture. Does not actually do anything.
if (typeof System$Globalization$CultureInfo !== "undefined")
    throw new Error();
var System$Globalization$CultureInfo = {
    fullname: "System.Globalization.CultureInfo",
    baseTypeName: "System.Object",
    staticDefinition: {
        cctor: function () {
        },
        get_InvariantCulture: function () { return null; }
    },
    assemblyName: "SharpKit.JsClr",
    Kind: "Class",
};
JsTypes.push(System$Globalization$CultureInfo);

// Fake implementation of LinkedList (it's just a copy of List)
if (typeof System$Collections$Generic$LinkedList$1 !== "undefined")
    throw new Error();
var System$Collections$Generic$LinkedList$1 = {
    fullname: "System.Collections.Generic.LinkedList$1",
    baseTypeName: "System.Object",
    assemblyName: "SharpKit.JsClr",
    interfaceNames: ["System.Collections.Generic.IList$1", "System.Collections.IList"],
    Kind: "Class",
    definition: {
        ctor: function (T) {
            this.T = T;
            this._list = null;
            System.Object.ctor.call(this);
            this._list = new Array();
        },
        ctor$$IEnumerable$1: function (T, collection) {
            this.T = T;
            this._list = null;
            System.Object.ctor.call(this);
            this._list = new Array();
            this.AddRange(collection);
        },
        RemoveRange: function (index, count) {
            this._list.splice(index, count);
        },
        Clear: function () {
            this._list.Clear();
        },
        Item$$: "`0",
        get_Item$$Int32: function (index) {
            if (index >= this._list.length || index < 0)
                throw $CreateException(new System.ArgumentOutOfRangeException.ctor$$String("index"), new Error());
            return this._list[index];
        },
        set_Item$$Int32: function (index, value) {
            if (index >= this._list.length || index < 0)
                throw $CreateException(new System.ArgumentOutOfRangeException.ctor$$String("index"), new Error());
            this._list[index] = value;
        },
        Count$$: "System.Int32",
        get_Count: function () {
            return this._list.length;
        },
        GetEnumerator: function () {
            return new System.Collections.IListEnumerator$1.ctor(this.T, this);
        },
        ToArray: function () {
            var len = this.get_Count();
            var array = new Array(len);
            for (var i = 0; i < len; i++)
                array[i] = this.get_Item$$Int32(i);
            return array;
        },
        AddRange: function (items) {
            var $it3 = items.GetEnumerator();
            while ($it3.MoveNext()) {
                var item = $it3.get_Current();
                this.Add(item);
            }
        },
        Add: function (item) {
            this._list.push(item);
        },
        Remove: function (item) {
            var index = this._list.indexOf(item);
            if (index == -1)
                return false;
            this._list.RemoveAt(index);
            return true;
        },
        Contains: function (item) {
            return this._list.contains(item);
        },
        SetItems: function (items) {
            this.Clear();
            if (items != null)
                this.AddRange(items);
        },
        IndexOf: function (item) {
            return this._list.indexOf(item);
        },
        Insert: function (index, item) {
            this._list.insert(index, item);
        },
        AddLast$$T: function (item) {
            this._list.insert(this._list.length, item);
        },
        get_First: function () {
            var self = this;
            var get_Next = function (i) {
                if (i >= self._list.length)
                    return null;
                v = self._list[i];
                return {
                    i: i,
                    v: v,
                    get_Value: function () { return v; },
                    get_Next: function () { return get_Next(i + 1); }
                }
            }
            return get_Next(0);
        },
        get_Last: function () {
            var self = this;
            var get_Next = function (i) {
                if (i >= self._list.length)
                    return null;
                v = self._list[i];
                return {
                    i: i,
                    v: v,
                    get_Value: function () { return v; },
                    get_Next: function () { return get_Next(i + 1); }
                }
            }
            return get_Next(self._list.length - 1);
        },
        Remove$$LinkedListNode$1: function (n) {
            this.RemoveAt(n.i);
        },
        AddFirst$$LinkedListNode$1: function (n) {
            this.Insert(0, n.v);
        },
        AddFirst$$T: function (n) {
            this.Insert(0, n);
        },
        AddLast$$T: function (n) {
            this.Add(n);
        },
        RemoveAt: function (index) {
            this._list.RemoveAt(index);
        },
        TryRemove: function (item) {
            throw $CreateException(new System.NotImplementedException.ctor$$String("TryRemove"), new Error());
        },
        CopyTo: function (array, arrayIndex) {
            throw $CreateException(new System.NotImplementedException.ctor$$String("JsImplList$T"), new Error());
        },
        IsReadOnly$$: "System.Boolean",
        get_IsReadOnly: function () {
            throw $CreateException(new System.NotImplementedException.ctor$$String("JsImplList$T"), new Error());
        },
        Reverse: function () {
            this._list.reverse();
        },
        Sort: function () {
            System.Array.Sort$1$$T$Array(this.T, this._list);
        },
        Sort$$Comparison$1: function (comparison) {
            this._list.sort(comparison);
        },
        ForEach: function (action) {
            if (action == null)
                throw $CreateException(new System.ArgumentNullException.ctor$$String("action"), new Error());
            for (var i = 0; i < this._list.length; i++) {
                action(this._list[i]);
            }
        }
    }
};
JsTypes.push(System$Collections$Generic$LinkedList$1);

if (typeof System$Collections$Generic$SortedDictionary$2 !== "undefined")
    throw new Error();
var System$Collections$Generic$SortedDictionary$2 = {
    fullname: "System.Collections.Generic.SortedDictionary$2",
    baseTypeName: "System.Object",
    assemblyName: "SharpKit.JsClr",
    interfaceNames: ["System.Collections.Generic.IDictionary$2"],
    Kind: "Class",
    definition: {
        ctor: function (TKey, TValue) {
            this.TKey = TKey;
            this.TValue = TValue;
            this._table = null;
            this._keys = null;
            this._version = 0;
            this.Comparer = null;
            System.Object.ctor.call(this);
            this._table = new Object();
            this._keys = new Object();
            this._version = 0;
        },
        ctor$$IComparer$1: function (TKey, TValue, comparer) {
            this.TKey = TKey;
            this.TValue = TValue;
            this._table = null;
            this._keys = null;
            this._version = 0;
            this.Comparer = null;
            System.Object.ctor.call(this);
            this._table = new Object();
            this._keys = new Object();
            this._version = 0;
            this.Comparer = comparer;
        },
        GetHashKey: function (key) {
            //if (this.Comparer != null)
            //return this.Comparer.GetHashCode$$T(key);
            return SharpKit.JavaScript.Utils.Js.GetHashKey(key);
        },
        Add: function (key, value) {
            if (key == null)
                throw $CreateException(new System.ArgumentNullException.ctor$$String("key"), new Error());
            if (this.ContainsKey(key))
                throw $CreateException(new System.ArgumentException.ctor$$String$$String$$Exception("The specified key already exists.", "key", null), new Error());
            var hashKey = this.GetHashKey(key);
            this._table[hashKey] = value;
            this._keys[hashKey] = key;
            this._version++;
        },
        Remove: function (key) {
            if (key == null)
                throw $CreateException(new System.ArgumentNullException.ctor$$String("key"), new Error());
            if (!this.ContainsKey(key))
                throw $CreateException(new System.ArgumentException.ctor$$String$$String$$Exception("The specified key does not exist.", "key", null), new Error());
            var hashKey = this.GetHashKey(key);
            delete this._table[hashKey];
            delete this._keys[hashKey];
            this._version++;
            return true;
        },
        Item$$: "`1",
        get_Item$$TKey: function (key) {
            if (!this.ContainsKey(key))
                throw $CreateException(new System.Collections.Generic.KeyNotFoundException.ctor$$String("The specified key does not exist."), new Error());
            var hashKey = this.GetHashKey(key);
            return this._table[hashKey];
        },
        set_Item$$TKey: function (key, value) {
            var hashKey = this.GetHashKey(key);
            this._table[hashKey] = value;
            this._keys[hashKey] = key;
            this._version++;
        },
        ContainsKey: function (key) {
            var hashKey = this.GetHashKey(key);
            return typeof (this._table[hashKey]) != "undefined";
        },
        Keys$$: "System.Collections.Generic.ICollection`1[[`0]]",
        get_Keys: function () {
            var keys = [];
            for (var p in this._keys) {
                keys.push(this._keys[p]);
            }
            if (this.Comparer != null)
                System.Array.Sort$1$$T$Array$$IComparer$1(this.TKey, keys, this.Comparer);
            else
                System.Array.Sort$$Array(keys);
            return keys;
        },
        Values$$: "System.Collections.Generic.ICollection`1[[`1]]",
        get_Values: function () {
            var values = [];
            var keys = this.get_Keys();
            for (var i = 0; i < keys.length; i++) {
                values.push(this._table[keys[i]]);
            }
            return values;
        },
        GetEnumerator: function () {
            var array = [];
            var keys = this.get_Keys();
            for (var i = 0; i < keys.length; i++) {
                var hashKey = keys[i];
                array.push(new System.Collections.Generic.KeyValuePair$2.ctor$$TKey$$TValue(this.TKey, this.TValue, hashKey, this._table[hashKey]));
            }
            return array.GetEnumerator();
        },
        Clear: function () {
            for (var hashKey in this._table) {
                this._keys = new Object();
                this._table = new Object();
                this._version++;
                return;
            }
        },
        TryGetValue: function (key, value) {
            var hashKey = this.GetHashKey(key);
            var v = this._table[hashKey];
            value.Value = v;
            return typeof (v) != "undefined";
        },
        Count$$: "System.Int32",
        get_Count: function () {
            return this._keys.length;
        },
        IsReadOnly$$: "System.Boolean",
        get_IsReadOnly: function () {
            throw $CreateException(new System.NotImplementedException.ctor(), new Error());
        }
    }
};
JsTypes.push(System$Collections$Generic$SortedDictionary$2);

// Fake implementation of System.MarshalByRefObject, so that it can be used without crashing.
var System$MarshalByRefObject = {
    fullname: "System.MarshalByRefObject",
    baseTypeName: "System.Object",
    assemblyName: "System",
    Kind: "Class",
    definition: {
        ctor: function () {
            System.Object.ctor.call(this);
        }
    }
};
JsTypes.push(System$MarshalByRefObject);

// Fake implementation of System.Console, so that it can be used without crashing.
var System$Console = {
    fullname: "System.Console",
    baseTypeName: "System.Object",
    staticDefinition: {
        WriteLine$$String: function () { },
        WriteLine$$String$$Object: function () { },
        WriteLine$$String$$Object$$Object: function () { }
    },
    Kind: "Class",
    definition: {
        ctor: function () {
            System.Object.ctor.call(this);
        }
    }
};
JsTypes.push(System$Console);

// Fake implementation of System.GC, so that it can be used without crashing.
var System$Console = {
    fullname: "System.GC",
    baseTypeName: "System.Object",
    staticDefinition: {
        SuppressFinalize: function (s) {
        }
    },
    Kind: "Class",
    definition: {
        ctor: function () {
            System.Object.ctor.call(this);
        }
    }
};
JsTypes.push(System$Console);

/**********************
* MSAGL TYPES CHANGES *
**********************/

// Prevents crashes when calling Add<T> on a set as an ICollection<T>
// 04/11/2014: fixed in SharpKit?
/*if (typeof Microsoft$Msagl$Core$DataStructures$Set$1.definition.Add !== "undefined")
    throw new Error();
Microsoft$Msagl$Core$DataStructures$Set$1.definition.Add = Microsoft$Msagl$Core$DataStructures$Set$1.definition.Add$$T;
*/
// This resolves naming issues with the generic HashSet.Contains method.
if (typeof Microsoft$Msagl$Core$DataStructures$Set$1.definition.Contains !== "undefined")
    throw new Error();
Microsoft$Msagl$Core$DataStructures$Set$1.definition.Contains = Microsoft$Msagl$Core$DataStructures$Set$1.definition.Contains$$T;

Microsoft$Msagl$Core$DataStructures$Set$1.definition.UpdateHashKey = function () {
    var ret = 0;
    var $it915 = this.GetEnumerator();
    while ($it915.MoveNext()) {
        var t = $it915.get_Current();
        var code = null;
        if (t.GetHashCode !== undefined)
            code = t.GetHashCode();
        else if (t._hashKey !== undefined)
            code = t._hashKey;
        ret |= code;
    }

    this._hashKey = ret.toString();
},


// Invoke SharpKit
Compile();

Microsoft.Msagl.Layout.Incremental.KDTree.Particle.Dim = { Horizontal: 0, Vertical: 1 };