<template>
    <div class="inline">
        <div @click="(e) => {
                e.stopPropagation();
                $refs[testKey].click();
            }
            " style="width: fit-content; height: fit-content">
            <slot>
                <button type="primary" size="small"> 上传数据 </button>
            </slot>
        </div>
        <input type="file" :ref="testKey" v-show="false" :multiple="multiple" :accept="accept" @change="chooseFile" />
    </div>
</template>
<script>
export default {
    components: {},
    model: {
        event: "change",
    },
    props: ["accept", "multiple"],
    data() {
        let testKey = Math.random();
        return {
            dialogVisible: false,
            testKey,
        };
    },
    created() { },
    methods: {
        async chooseFile(e) {
            if (e.target.files.length) {
                this.$emit("change", e.target.files);
            }
        },
    },
};
</script>