import React, { Fragment, PureComponent, Component } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity as Button,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import Progress from 'react-native-progress-circle';
import { std, rem } from '../styleguide';

const st = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: std.color.shade3,
  },
  navbar: {
    backgroundColor: std.color.shade1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: std.gap.sm,
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navbarTitle: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.shade9,
  },
  navbarOptLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: std.gap.lg,
    top: 0,
    bottom: 0,
    paddingRight: std.gap.lg,
  },
  navbarOptText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.action,
  },
  chats: {
    flex: 1,
    paddingTop: std.gap.lg,
  },
  // workaround for scrollview bottom padding on native
  chatsFoot: {
    height: std.gap.lg,
  },
  chat: {
    alignSelf: 'center',
  },
  chatAvatar: {
    width: std.textSize.md + std.gap.md * 2,
    height: std.textSize.md + std.gap.md * 2,
    borderRadius: std.textSize.md / 2 + std.gap.md,
    borderColor: std.color.shade4,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    top:
      std.textSize.sm + std.gap.lg + std.gap.md + (std.gap.lg + std.gap.sm) / 2,
    left: -(std.textSize.md + std.gap.md * 2 + std.gap.md),
  },
  chatCreator: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    fontWeight: 'bold',
    lineHeight: std.textSize.md + std.gap.sm * 2,
    color: std.color.shade5,
    marginBottom: std.gap.md,
  },
  chatCreated: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.shade5,
    marginTop: std.gap.lg,
    marginBottom: std.gap.md,
    alignSelf: 'flex-end',
  },
  chatBody: {
    width: rem(320),
    padding: std.gap.lg,
    backgroundColor: std.color.shade0,
    borderRadius: std.gap.md,
    marginBottom: std.gap.sm,
  },
  chatText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.sm * 2,
    color: std.color.shade9,
  },
  edit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: std.color.shade0,
    borderColor: std.color.shade4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editTextInput: {
    flex: 1,
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    color: std.color.shade9,
    paddingVertical: std.gap.lg * 2,
    paddingHorizontal: std.gap.lg,
  },
  pickFile: {
    width: std.iconSize.md * 2,
    height: std.iconSize.md * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: std.iconSize.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade4,
    marginRight: std.gap.lg,
  },
  pickFileIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.md,
    color: std.color.action,
  },
  loadingRecent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMore: {
    width: rem(320),
    alignItems: 'center',
    padding: std.gap.lg,
    backgroundColor: std.color.shade0,
    borderRadius: std.gap.md,
    alignSelf: 'center',
    marginBottom: std.gap.sm,
  },
  loadMoreText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    color: std.color.action,
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontFamily: std.font.text,
    fontSize: std.textSize.md,
    lineHeight: std.textSize.md + std.gap.md * 2,
    color: std.color.shade9,
    paddingRight: std.gap.md,
  },
  fileSize: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    lineHeight: std.textSize.sm + std.gap.sm * 2,
    color: std.color.shade5,
  },
  fileAccept: {
    width: std.iconSize.md * 2,
    height: std.iconSize.md * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: std.iconSize.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade4,
    marginLeft: std.gap.lg,
  },
  fileAcceptIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.md,
    color: std.color.action,
  },
  fileReject: {
    width: std.iconSize.md * 2,
    height: std.iconSize.md * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: std.iconSize.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: std.color.shade4,
  },
  fileRejectIcon: {
    fontFamily: std.font.icon,
    fontSize: std.iconSize.md,
    color: std.color.notice,
  },
  fileSuccessText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.active,
  },
  fileFailureText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.danger,
  },
  fileStoppedText: {
    fontFamily: std.font.text,
    fontSize: std.textSize.sm,
    color: std.color.shade5,
  },
});

const pure = Component =>
  class extends PureComponent {
    render = () => <Component {...this.props} />;
  };

const Navbar = pure(p => (
  <View style={st.navbar}>
    <Button style={st.navbarOptLeft} onPress={p.back}>
      <Text style={st.navbarOptText}>Back</Text>
    </Button>
    <Text style={st.navbarTitle}>{p.buddyName}</Text>
  </View>
));

const File = pure(p => (
  <View style={st.file}>
    <View style={st.fileInfo}>
      <Text style={st.fileName}>{p.name}</Text>
      <Text style={st.fileSize}>{p.size}</Text>
    </View>
    {p.transferWaiting && (
      <Button style={st.fileReject} onPress={p.reject}>
        <Text style={st.fileRejectIcon}>icon_x</Text>
      </Button>
    )}
    {p.incoming &&
      p.transferWaiting && (
        <Button style={st.fileAccept} onPress={p.accept}>
          <Text style={st.fileAcceptIcon}>icon_check</Text>
        </Button>
      )}
    {p.transferStarted && (
      <Button style={st.fileReject} onPress={p.reject}>
        <Progress
          percent={p.transferPercent}
          radius={std.iconSize.md}
          borderWidth={StyleSheet.hairlineWidth * 2}
          color={std.color.notice}
          shadowColor={std.color.shade4}
          bgColor={std.color.shade0}
        >
          <Text style={st.fileRejectIcon}>icon_x</Text>
        </Progress>
      </Button>
    )}
    {p.transferSuccess && <Text style={st.fileSuccessText}>Success</Text>}
    {p.transferFailure && <Text style={st.fileFailureText}>Failed</Text>}
    {p.transferStopped && <Text style={st.fileStoppedText}>Canceled</Text>}
  </View>
));

const MiniChat = pure(p => (
  <View style={st.chat}>
    <View style={st.chatBody}>
      {!!p.text && (
        <Text style={st.chatText} numberOfLines={999}>
          {p.text}
        </Text>
      )}
      {!!p.file && (
        <File
          {...p.file}
          accept={() => p.acceptFile(p.file)}
          reject={() => p.rejectFile(p.file)}
        />
      )}
    </View>
  </View>
));

const FullChat = pure(p => (
  <View style={st.chat}>
    <Image style={st.chatAvatar} source={{ uri: p.creatorAvatar }} />
    <Text style={st.chatCreated}>{p.created}</Text>
    <View style={st.chatBody}>
      <Text style={st.chatCreator}>{p.creatorName}</Text>
      {!!p.text && (
        <Text style={st.chatText} numberOfLines={999}>
          {p.text}
        </Text>
      )}
      {!!p.file && (
        <File
          {...p.file}
          accept={() => p.acceptFile(p.file)}
          reject={() => p.rejectFile(p.file)}
        />
      )}
    </View>
  </View>
));

const Chat = p => (p.mini ? <MiniChat {...p} /> : <FullChat {...p} />);

class Scroll extends Component {
  _justMounted = true;
  _closeToBottom = true;

  render = () => (
    <ScrollView
      {...this.props}
      scrollEventThrottle={120}
      ref={this.setViewRef}
      onContentSizeChange={this.onContentSizeChange}
      onScroll={this.onScroll}
    />
  );

  setViewRef = ref => {
    this.view = ref;
  };

  onContentSizeChange = () => {
    if (this._closeToBottom) {
      this.view.scrollToEnd({
        animated: !this._justMounted,
      });
      if (this._justMounted) {
        this._justMounted = false;
      }
    }
  };

  onScroll = ev => {
    ev = ev.nativeEvent;
    const layoutSize = ev.layoutMeasurement;
    const layoutHeight = layoutSize.height;
    const contentOffset = ev.contentOffset;
    const contentSize = ev.contentSize;
    const contentHeight = contentSize.height;
    const paddingToBottom = 20;
    this._closeToBottom =
      layoutHeight + contentOffset.y >= contentHeight - paddingToBottom;
  };
}

const Chats = p => (
  <Scroll style={st.chats}>
    {p.hasMore && (
      <Button style={st.loadMore} onPress={p.loadMore}>
        <Text style={st.loadMoreText}>Load More</Text>
      </Button>
    )}
    {p.loadingMore && <ActivityIndicator />}
    {p.ids.map((id, index) => (
      <Chat
        key={id}
        {...p.resolve(id, index)}
        acceptFile={p.acceptFile}
        rejectFile={p.rejectFile}
      />
    ))}
    <View style={st.chatsFoot} />
  </Scroll>
);

const Edit = pure(p => (
  <View style={st.edit}>
    <TextInput
      style={st.editTextInput}
      placeholder="Type your message"
      blurOnSubmit={false}
      value={p.text}
      onChangeText={p.setText}
      onSubmitEditing={p.submitText}
    />
    <Button style={st.pickFile} onPress={p.pickFile}>
      <Text style={st.pickFileIcon}>icon_paperclip</Text>
    </Button>
  </View>
));

const LoadingRecent = () => (
  <View style={st.loadingRecent}>
    <ActivityIndicator />
  </View>
);

const Main = p => (
  <Fragment>
    <Chats
      hasMore={p.hasMore}
      loadingMore={p.loadingMore}
      ids={p.chatIds}
      resolve={p.resolveChat}
      loadMore={p.loadMore}
      acceptFile={p.acceptFile}
      rejectFile={p.rejectFile}
    />
    <Edit
      text={p.editingText}
      setText={p.setEditingText}
      submitText={p.submitEditingText}
      pickFile={p.pickFile}
    />
  </Fragment>
);

const BuddyChatsRecent = p => (
  <KeyboardAvoidingView style={st.main}>
    <Navbar buddyName={p.buddyName} back={p.back} />
    {p.loadingRecent ? <LoadingRecent /> : <Main {...p} />}
  </KeyboardAvoidingView>
);

export default BuddyChatsRecent;
