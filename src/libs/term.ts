
export const kEmptyTerms = '';
export const kArraySplitter = ' ';
export const kItemSplitter = '';

function hashForSingleArray(array: any) {
    return `${array[1]}${array[0]}`;
}

export function hashArray<T>(array: T[]): string {
    if (array.length === 0) {
        return kEmptyTerms;
    }
    if (Array.isArray(array[0])) {
        return array.map(hashForSingleArray).join(kArraySplitter);
    }
    return hashForSingleArray(array);
}

function singleArrayFromHash(hash: string) {
    if (hash.length < 2 || !'XYZ'.includes(hash[0])) {
        throw new Error(`Invalid hash ${hash}`);
    }
    const a = hash[0];
    const n = hash.slice(1);
    return [parseInt(n, 10), a];

}

export function arrayFromHash(str: string, sort: boolean = true) {
    if (str.length === 0) {
        return [];
    }
    if (str.includes(kArraySplitter)) {
        const result = str.split(kArraySplitter).map(singleArrayFromHash);
        if (sort) {
            return result.sort((a, b) => (a[0] as number) - (b[0] as number));
        }
        return result;
    }
    return [singleArrayFromHash(str)];
}
